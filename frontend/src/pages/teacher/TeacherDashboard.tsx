import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import AttendanceModal from '../../components/AttendanceModal';
import AttendanceHistory from '../../components/AttendanceHistory';
import StudentOverviewModal from '../../components/StudentOverviewModal';
import MarksAllocationModal from '../../components/MarksAllocationModal';

interface TeacherData {
  classId: string;
  classCode: string;
  teacherName: string;
  university: string;
  course: string;
  year: number;
  semester: number;
}

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  dob: string;
  parentName: string;
  address: string;
  credentials: {
    username: string;
    password: string;
  };
  attendancePercentage: number;
  attendanceStatus: string;
  averageInternal: number;
  averageSemester: number;
  isActive: boolean;
}

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [showStudentOverview, setShowStudentOverview] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  const theme = {
    dark: {
      bg: '#000000',
      cardBg: '#111111',
      headerBg: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
      text: '#ffffff',
      textSecondary: '#888888',
      border: '#333333',
      accent: '#ffffff'
    },
    light: {
      bg: '#ffffff',
      cardBg: '#f8f9fa',
      headerBg: 'linear-gradient(135deg, #ffffff 0%, #f1f3f4 100%)',
      text: '#000000',
      textSecondary: '#666666',
      border: '#e0e0e0',
      accent: '#000000'
    }
  };

  const currentTheme = isDarkTheme ? theme.dark : theme.light;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const teacherToken = localStorage.getItem('token');
        const teacherInfo = localStorage.getItem('teacher');
        if (!teacherToken || !teacherInfo) {
          console.log('No token or teacher info in localStorage');
          navigate('/teacher');
          return;
        }

        const authData = JSON.parse(teacherInfo);
        console.log('authData:', authData);

        if (authData.classInfo) {
          setTeacherData({
            classId: authData.classInfo.classId || 'N/A',
            classCode: authData.classInfo.classCode || 'N/A',
            teacherName: authData.classInfo.teacherName || authData.user?.name || 'N/A',
            university: authData.classInfo.university || 'N/A',
            course: authData.classInfo.course || 'N/A',
            year: authData.classInfo.year || 0,
            semester: authData.classInfo.semester || 0
          });
        }

        axios.get('/api/classes/my-class', {
          headers: {
            Authorization: `Bearer ${teacherToken}`
          }
        }).then(classResponse => {
          console.log('Class response:', classResponse.data);
          if (classResponse.data.class) {
            const currentClass = classResponse.data.class;
            setTeacherData({
              classId: currentClass.classId || 'N/A',
              classCode: currentClass.classCode,
              teacherName: currentClass.teacherName || authData.user?.name || 'N/A',
              university: currentClass.university,
              course: currentClass.course,
              year: currentClass.year,
              semester: currentClass.semester
            });
            setSubjects(currentClass.subjects || []);
            loadStudents(currentClass.classCode, teacherToken); // Use classCode
          } else {
            if (!authData.classInfo) {
              console.log('No class found in API and no classInfo in localStorage');
              setTeacherData(null);
              setSubjects([]);
              setStudents([]);
              toast.error('No class assigned to this teacher');
            }
          }
        }).catch(backendError => {
          console.error('Error fetching class:', backendError.response?.data || backendError);
          if (!authData.classInfo) {
            console.log('No class found in API and no classInfo in localStorage');
            setTeacherData(null);
            setSubjects([]);
            setStudents([]);
            toast.error('No class assigned to this teacher');
          }
        });
        setLoading(false);
      } catch (error: any) {
        console.error('Dashboard error:', error);
        setError(`Failed to load dashboard: ${error.message}`);
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const loadStudents = async (classCode: string, token: string) => {
    try {
      console.log('Loading students for classCode:', classCode);
      const response = await axios.get(`/api/students/class/${classCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Students response:', response.data);
      if (response.data.students) {
        setStudents(response.data.students);
        console.log('Set students count:', response.data.students.length);
      } else {
        setStudents([]);
        console.log('No students data in response');
      }
    } catch (error: any) {
      console.error('Error loading students:', error.response?.data || error);
      setStudents([]);
      if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else if (error.response?.status === 404) {
        toast.error('Class not found. Please refresh and try again.');
      } else {
        toast.error('Failed to load students. Please check your connection.');
      }
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !teacherData) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('csvFile', uploadFile);

      const response = await axios.post(`/api/students/upload-csv/${teacherData.classId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success(response.data.message);
      setShowUploadModal(false);
      setUploadFile(null);

      const teacherToken = localStorage.getItem('token');
      if (teacherToken && teacherData.classCode) {
        await loadStudents(teacherData.classCode, teacherToken); // Use classCode
      }
    } catch (error: any) {
      console.error('CSV upload error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleTakeAttendance = (subjectName: string) => {
    if (!teacherData) {
      toast.error('No class assigned. Cannot take attendance.');
      return;
    }
    console.log('Taking attendance for subject:', subjectName);
    console.log('Teacher data:', teacherData);

    setSelectedSubject(subjectName);
    setShowAttendanceModal(true);
  };

  const handleAttendanceTaken = () => {
    if (teacherData) {
      const teacherToken = localStorage.getItem('token');
      console.log(teacherToken, 'Teacher token after attendance taken');

      if (teacherToken) {
        loadStudents(teacherData.classCode, teacherToken);
      }
    }
  };

  const handleStudentClick = (studentId: string, studentName: string) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
    setShowStudentOverview(true);
  };

  const handleMarksAllocated = () => {
    if (teacherData) {
      const teacherToken = localStorage.getItem('token');
      if (teacherToken) {
        loadStudents(teacherData.classId, teacherToken);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('teacher');
    navigate('/teacher');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: isDarkTheme ? '#000000' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDarkTheme ? '#ffffff' : '#000000',
        fontSize: '20px'
      }}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: isDarkTheme ? '#000000' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: isDarkTheme ? '#ffffff' : '#000000'
      }}>
        <div style={{ color: '#EF4444', fontSize: '20px', marginBottom: '16px' }}>Error: {error}</div>
        <button
          onClick={() => navigate('/teacher')}
          style={{
            backgroundColor: '#EF4444',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Return to Login
        </button>
      </div>
    );
  }

  if (!teacherData) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: isDarkTheme ? '#000000' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: isDarkTheme ? '#ffffff' : '#000000'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          No Class Assigned
        </h2>
        <p style={{ fontSize: '16px', color: isDarkTheme ? '#888888' : '#666666', marginBottom: '24px', textAlign: 'center' }}>
          You are not currently assigned to any class. Please contact the admin to assign a class.
        </p>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#EF4444',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.bg,
      color: currentTheme.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        background: currentTheme.headerBg,
        padding: '20px 24px',
        borderBottom: `1px solid ${currentTheme.border}`,
        boxShadow: isDarkTheme ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '32px' }}>📚</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: currentTheme.text }}>
              Teacher Dashboard
            </h1>
            <p style={{ margin: '4px 0 0 0', color: currentTheme.textSecondary, fontSize: '16px', fontWeight: '500' }}>
              Welcome back, {teacherData.teacherName}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '8px'
            }}
          >
            {isDarkTheme ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '8px 12px',
              color: currentTheme.text
            }}
          >
            🏠 Home
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: '側12px 20px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome Section */}
        <div style={{
          marginBottom: '40px',
          background: isDarkTheme ?
            'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%)' :
            'linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.1) 100%)',
          padding: '32px',
          borderRadius: '20px',
          border: `1px solid ${currentTheme.border}`
        }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px', color: currentTheme.text }}>
            Welcome back, {teacherData.teacherName}! 👋
          </h1>
          <p style={{ color: currentTheme.textSecondary, fontSize: '18px', fontWeight: '500', margin: 0 }}>
            🎓 Class ID: {teacherData.classId} • 📚 {teacherData.classCode} • 🏛️ {teacherData.course} • 🏫 {teacherData.university}
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: isDarkTheme ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            padding: '32px',
            borderRadius: '20px',
            border: `1px solid ${currentTheme.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '48px', fontWeight: '900', margin: '0 0 8px 0', color: '#f59e0b' }}>
                  {students.length}
                </p>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '16px', fontWeight: '600' }}>Total Students</p>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                👥
              </div>
            </div>
          </div>

          <div style={{
            background: isDarkTheme ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            padding: '32px',
            borderRadius: '20px',
            border: `1px solid ${currentTheme.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '48px', fontWeight: '900', margin: '0 0 8px 0', color: '#f59e0b' }}>
                  {subjects.length}
                </p>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '16px', fontWeight: '600' }}>Subjects</p>
              </div>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                📚
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={!teacherData}
            style={{
              background: isDarkTheme ?
                'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)' :
                'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
              color: teacherData ? '#10b981' : '#94a3b8',
              padding: '20px 32px',
              borderRadius: '14px',
              border: `2px solid ${teacherData ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
              cursor: teacherData ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (teacherData) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              if (teacherData) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
              }
            }}
          >
            📤 Upload Student Details CSV
          </button>

          <button
            onClick={() => setShowAttendanceHistory(true)}
            disabled={!teacherData}
            style={{
              background: isDarkTheme ?
                'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)' :
                'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(29, 78, 216, 0.05) 100%)',
              color: teacherData ? '#3b82f6' : '#94a3b8',
              padding: '20px 32px',
              borderRadius: '14px',
              border: `2px solid ${teacherData ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
              cursor: teacherData ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (teacherData) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              if (teacherData) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }
            }}
          >
            📊 View Attendance History
          </button>

          <button
            onClick={() => setShowMarksModal(true)}
            disabled={!teacherData}
            style={{
              background: isDarkTheme ?
                'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)' :
                'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)',
              color: teacherData ? '#f59e0b' : '#94a3b8',
              padding: '20px 32px',
              borderRadius: '14px',
              border: `2px solid ${teacherData ? 'rgba(245, 158, 11, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
              cursor: teacherData ? 'pointer' : 'not-allowed',
              fontSize: '18px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (teacherData) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              if (teacherData) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
              }
            }}
          >
            ✏️ Allocate Marks
          </button>
        </div>

        {/* Subjects Section with Attendance Buttons */}
        <div style={{
          backgroundColor: currentTheme.cardBg,
          padding: '24px',
          borderRadius: '12px',
          border: `1px solid ${currentTheme.border}`,
          marginBottom: '32px'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: currentTheme.text }}>
            Class Subjects
          </h3>
          {subjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
              <h4 style={{ fontSize: '18px', color: currentTheme.textSecondary, marginBottom: '8px' }}>
                No Subjects Found
              </h4>
              <p style={{ color: currentTheme.textSecondary }}>
                Subjects will appear here when they are added to your class
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {subjects.map((subject: any, index: number) => (
                <div key={index} style={{
                  backgroundColor: isDarkTheme ? '#1a1a1a' : '#f1f3f5',
                  padding: '24px',
                  borderRadius: '12px',
                  border: `1px solid ${currentTheme.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: currentTheme.text }}>
                      {subject.name || subject}
                    </h4>
                    <p style={{ color: currentTheme.textSecondary, margin: 0 }}>
                      Teacher: {subject.teacherName || 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTakeAttendance(subject.name || subject)}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    📋 Take Attendance
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Students Section */}
        <div style={{
          backgroundColor: currentTheme.cardBg,
          padding: '24px',
          borderRadius: '12px',
          border: `1px solid ${currentTheme.border}`
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: currentTheme.text }}>
            Class Students
          </h3>
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
              <h4 style={{ fontSize: '18px', color: currentTheme.textSecondary, marginBottom: '8px' }}>
                No Students Uploaded
              </h4>
              <p style={{ color: currentTheme.textSecondary, marginBottom: '24px' }}>
                Upload student data to get started
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                disabled={!teacherData}
                style={{
                  backgroundColor: teacherData ? '#10B981' : '#94a3b8',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: teacherData ? 'pointer' : 'not-allowed',
                  fontSize: '16px'
                }}
              >
                📤 Upload Student Data
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: currentTheme.textSecondary }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: currentTheme.textSecondary }}>Roll Number</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: currentTheme.textSecondary }}>DOB</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: currentTheme.textSecondary }}>Parent Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: currentTheme.textSecondary }}>Login</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: currentTheme.textSecondary }}>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student._id} style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => handleStudentClick(student._id, student.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            textDecoration: 'underline',
                            padding: 0
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.color = '#1d4ed8';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.color = '#3b82f6';
                          }}
                        >
                          {student.name}
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', color: currentTheme.text }}>{student.rollNumber}</td>
                      <td style={{ padding: '12px 16px', color: currentTheme.text }}>{student.dob}</td>
                      <td style={{ padding: '12px 16px', color: currentTheme.text }}>{student.parentName}</td>
                      <td style={{ padding: '12px 16px', color: currentTheme.text }}>
                        <div style={{ fontSize: '12px' }}>
                          <div>👤 {student.credentials.username}</div>
                          <div>🔑 {student.credentials.password}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          color: (student.attendancePercentage || 0) >= 75 ? '#10b981' :
                            (student.attendancePercentage || 0) >= 50 ? '#f59e0b' : '#ef4444',
                          fontWeight: '600'
                        }}>
                          {typeof student.attendancePercentage === 'number' ? student.attendancePercentage : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && teacherData && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBg,
            padding: '32px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            border: `1px solid ${currentTheme.border}`
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: currentTheme.text }}>
              Upload Student CSV
            </h3>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '6px',
                  backgroundColor: currentTheme.bg,
                  color: currentTheme.text
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  padding: '12px 24px',
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: currentTheme.text,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!uploadFile || uploading}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1
                }}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {teacherData && (
        <AttendanceModal
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          subject={selectedSubject}
          classCode={teacherData.classCode}
          onAttendanceTaken={handleAttendanceTaken}
        />
      )}

      {/* Attendance History Modal */}
      {teacherData && (
        <AttendanceHistory
          isOpen={showAttendanceHistory}
          onClose={() => setShowAttendanceHistory(false)}
          classCode={teacherData.classCode}
        />
      )}

      {/* Student Overview Modal */}
      <StudentOverviewModal
        isOpen={showStudentOverview}
        onClose={() => setShowStudentOverview(false)}
        studentId={selectedStudentId}
        studentName={selectedStudentName}
      />

      {/* Marks Allocation Modal */}
      {teacherData && (
        <MarksAllocationModal
          isOpen={showMarksModal}
          onClose={() => setShowMarksModal(false)}
          classCode={teacherData.classCode}
          onMarksAllocated={handleMarksAllocated}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;