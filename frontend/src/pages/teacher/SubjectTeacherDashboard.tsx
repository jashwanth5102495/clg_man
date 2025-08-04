import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Calendar, CheckCircle, XCircle, Save, BookOpen } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import toast from 'react-hot-toast';

interface Student {
  name: string;
  rollNumber: string;
  isPresent?: boolean;
}

interface ClassAssignment {
  classCode: string;
  subject: string;
}

const SubjectTeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [teacherData, setTeacherData] = useState<any>(null);
  const [showAddClass, setShowAddClass] = useState(false);
  const [classAssignments, setClassAssignments] = useState<ClassAssignment[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [showAttendance, setShowAttendance] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [subjectSelection, setSubjectSelection] = useState('');
  const [attendanceSubject, setAttendanceSubject] = useState<string | null>(null);
  const [showOverallAttendance, setShowOverallAttendance] = useState(false);
  
  const [newClassData, setNewClassData] = useState({
    classCode: '',
    subject: ''
  });

  useEffect(() => {
    const authData = localStorage.getItem('subjectTeacherAuth');
    if (authData) {
      const data = JSON.parse(authData);
      setTeacherData(data);
      
      // Load available classes from admin
      const adminClasses = JSON.parse(localStorage.getItem('adminClasses') || '[]');
      setAvailableClasses(adminClasses);
      
      // Load existing class assignments for this teacher
      const savedAssignments = localStorage.getItem(`subjectTeacher_${data.collegeId}_classes`);
      if (savedAssignments) {
        setClassAssignments(JSON.parse(savedAssignments));
      }
    } else {
      navigate('/teacher/subject');
    }
  }, [navigate]);

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if this teacher teaches this subject
    if (!teacherData.subjects.includes(newClassData.subject)) {
      toast.error('You are not authorized to teach this subject');
      return;
    }

    // Check if assignment already exists
    const exists = classAssignments.some(assignment => 
      assignment.classCode === newClassData.classCode && assignment.subject === newClassData.subject
    );

    if (exists) {
      toast.error('You are already assigned to this class and subject');
      return;
    }

    const newAssignment: ClassAssignment = {
      classCode: newClassData.classCode,
      subject: newClassData.subject
    };

    const updatedAssignments = [...classAssignments, newAssignment];
    setClassAssignments(updatedAssignments);
    
    // Save to localStorage
    localStorage.setItem(`subjectTeacher_${teacherData.collegeId}_classes`, JSON.stringify(updatedAssignments));
    
    toast.success('Class assignment added successfully!');
    setShowAddClass(false);
    setNewClassData({ classCode: '', subject: '' });
  };

  const loadStudentsForClass = (classCode: string) => {
    // Load students from the class teacher's uploaded data
    const classStudents = JSON.parse(localStorage.getItem(`students_${classCode}`) || '[]');
    setSelectedClass(classCode);
    setShowAttendance(false);
    setSubjectSelection('');
    setStudents([]);
    if (classStudents.length === 0) {
      toast.error('No students found for this class. Please ask the class teacher to upload student data.');
      return;
    }
    setStudents(classStudents.map((student: any) => ({ 
      name: student.name,
      rollNumber: student.rollNumber,
      isPresent: false 
    })));
  };

  const toggleStudentAttendance = (index: number) => {
    setStudents(prev => prev.map((student, i) => 
      i === index 
        ? { ...student, isPresent: !student.isPresent }
        : student
    ));
  };

  const submitAttendance = () => {
    const attendanceData = {
      classCode: selectedClass,
      subject: selectedSubject,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      teacherName: teacherData.teacherName,
      teacherCollegeId: teacherData.collegeId,
      students: students.map(student => ({
        name: student.name,
        rollNumber: student.rollNumber,
        isPresent: student.isPresent || false
      })),
      presentStudents: students.filter(s => s.isPresent).map(s => s.name),
      absentStudents: students.filter(s => !s.isPresent).map(s => s.name),
      timestamp: new Date().toISOString()
    };

    // Save attendance data for subject teacher records
    const existingAttendance = JSON.parse(localStorage.getItem('subjectTeacherAttendance') || '[]');
    existingAttendance.push(attendanceData);
    localStorage.setItem('subjectTeacherAttendance', JSON.stringify(existingAttendance));

    // Update class teacher's daily attendance log
    const classTeacherLog = JSON.parse(localStorage.getItem(`classTeacher_${selectedClass}_dailyAttendance`) || '[]');
    classTeacherLog.push({
      date: new Date().toISOString().split('T')[0],
      subject: selectedSubject,
      teacher: teacherData.teacherName,
      studentsPresent: students.filter(s => s.isPresent).length,
      totalStudents: students.length,
      timestamp: new Date().toISOString(),
      presentStudents: students.filter(s => s.isPresent).map(s => s.name),
      absentStudents: students.filter(s => !s.isPresent).map(s => s.name)
    });
    localStorage.setItem(`classTeacher_${selectedClass}_dailyAttendance`, JSON.stringify(classTeacherLog));

    toast.success(`Attendance submitted successfully for ${selectedSubject}!`);
    setShowAttendance(false);
    setStudents([]);
  };

  const getClassSubjects = (classCode: string) => {
    const classDetails = availableClasses.find(cls => cls.classCode === classCode);
    return classDetails?.subjects || [];
  };

  const getSubjectTeacher = (classCode: string, subject: string) => {
    const classDetails = availableClasses.find(cls => cls.classCode === classCode);
    const subjectDetails = classDetails?.subjects?.find((s: any) => s.name === subject);
    return subjectDetails?.teacherName || 'Unknown';
  };

  if (!teacherData) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <Header title="Subject Teacher Dashboard" showBack backPath="/teacher/subject" showLogout />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome, {teacherData.teacherName}!
            </h1>
            <p className="text-gray-400">
              Subject Teacher • College ID: {teacherData.collegeId}
            </p>
            <p className="text-sm text-green-400">
              Subjects: {teacherData.subjects.join(', ')}
            </p>
          </div>
          <Button
            onClick={() => setShowAddClass(true)}
            icon={Plus}
            size="lg"
          >
            Add Class
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{teacherData.subjects.length}</p>
                <p className="text-gray-400">Subjects</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{classAssignments.length}</p>
                <p className="text-gray-400">Class Assignments</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {new Date().toLocaleDateString()}
                </p>
                <p className="text-gray-400">Today</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Class Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Class</label>
          <select
            value={selectedClass}
            onChange={e => loadStudentsForClass(e.target.value)}
            className="w-full max-w-xs px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
          >
            <option value="">Select Class</option>
            {classAssignments.map(assignment => (
              <option key={assignment.classCode} value={assignment.classCode}>
                {assignment.classCode}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Cards with Take Attendance Button */}
        {selectedClass && students.length > 0 && !attendanceSubject && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {getClassSubjects(selectedClass)
              .filter((subj: any) => teacherData.subjects.includes(subj.name))
              .map((subj: any) => {
                // Check if attendance already taken for today
                const today = new Date().toISOString().split('T')[0];
                const attendanceKey = `subjectTeacherAttendance_${selectedClass}_${subj.name}`;
                const attendanceRecords = JSON.parse(localStorage.getItem(attendanceKey) || '[]');
                const alreadyTaken = attendanceRecords.some((rec: any) => rec.date === today);
                return (
                  <Card key={subj.name} className="p-8 bg-neutral-800 flex flex-col items-center justify-center">
                    <h3 className="text-xl font-bold text-white mb-2">{subj.name}</h3>
                    <p className="text-gray-400 mb-4">Teacher: {subj.teacherName}</p>
                    <Button
                      onClick={() => setAttendanceSubject(subj.name)}
                      disabled={alreadyTaken}
                      className="mb-2"
                    >
                      {alreadyTaken ? 'Attendance Taken' : 'Take Attendance'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowOverallAttendance(subj.name)}
                    >
                      Overall Attendance
                    </Button>
                  </Card>
                );
              })}
          </div>
        )}

        {/* Attendance Table for Selected Subject */}
        {attendanceSubject && (
          <Card className="p-8 bg-neutral-800">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Take Attendance
                </h3>
                <p className="text-gray-400">
                  {attendanceSubject} - {selectedClass}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Students Present</p>
                <p className="text-2xl font-bold text-green-400">
                  {students.filter(s => s.isPresent).length} / {students.length}
                </p>
              </div>
            </div>
            <div className="space-y-3 mb-8 max-h-96 overflow-y-auto">
              {students.map((student, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    student.isPresent
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }`}
                  onClick={() => toggleStudentAttendance(index)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      student.isPresent ? 'bg-green-500' : 'bg-gray-600'
                    }`}>
                      {student.isPresent ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <XCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {student.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {student.rollNumber}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    student.isPresent
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {student.isPresent ? 'Present' : 'Absent'}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => {
                  // Save attendance for this subject/class/date
                  const today = new Date().toISOString().split('T')[0];
                  const attendanceKey = `subjectTeacherAttendance_${selectedClass}_${attendanceSubject}`;
                  const attendanceRecords = JSON.parse(localStorage.getItem(attendanceKey) || '[]');
                  attendanceRecords.push({
                    date: today,
                    students: students.map(s => ({ name: s.name, rollNumber: s.rollNumber, isPresent: s.isPresent })),
                    presentCount: students.filter(s => s.isPresent).length,
                    total: students.length
                  });
                  localStorage.setItem(attendanceKey, JSON.stringify(attendanceRecords));
                  setAttendanceSubject(null);
                  toast.success('Attendance saved!');
                }}
                icon={Save}
                className="flex-1"
                size="lg"
              >
                Save Attendance
              </Button>
              <Button
                variant="secondary"
                onClick={() => setAttendanceSubject(null)}
                className="flex-1"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Overall Attendance Modal/Table */}
        {showOverallAttendance && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <Card className="p-8 max-w-2xl w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-6">Overall Attendance - {showOverallAttendance}</h3>
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300">Name</th>
                    <th className="text-left py-3 px-4 text-gray-300">Roll Number</th>
                    <th className="text-left py-3 px-4 text-gray-300">Days Present</th>
                    <th className="text-left py-3 px-4 text-gray-300">Total Days</th>
                    <th className="text-left py-3 px-4 text-gray-300">% Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const attendanceKey = `subjectTeacherAttendance_${selectedClass}_${showOverallAttendance}`;
                    const attendanceRecords = JSON.parse(localStorage.getItem(attendanceKey) || '[]');
                    const studentStats: Record<string, { name: string; rollNumber: string; present: number; total: number }> = {};
                    students.forEach(s => {
                      studentStats[s.rollNumber] = { name: s.name, rollNumber: s.rollNumber, present: 0, total: attendanceRecords.length };
                    });
                    attendanceRecords.forEach((rec: any) => {
                      rec.students.forEach((stu: any) => {
                        if (stu.isPresent && studentStats[stu.rollNumber]) {
                          studentStats[stu.rollNumber].present += 1;
                        }
                      });
                    });
                    return Object.values(studentStats).map((stat, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-4 px-4 text-white">{stat.name}</td>
                        <td className="py-4 px-4 text-gray-300">{stat.rollNumber}</td>
                        <td className="py-4 px-4 text-green-400">{stat.present}</td>
                        <td className="py-4 px-4 text-blue-400">{stat.total}</td>
                        <td className="py-4 px-4 text-yellow-400">{stat.total > 0 ? ((stat.present / stat.total) * 100).toFixed(1) : '0'}%</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
              <Button onClick={() => setShowOverallAttendance(false)} className="w-full">Close</Button>
            </Card>
          </div>
        )}

        {/* No students message */}
        {selectedClass && students.length === 0 && (
          <div className="p-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-200 text-center">
            No students found for this class. Please ask the class teacher to upload student data.
          </div>
        )}

        {/* Add Class Modal */}
        {showAddClass && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <Card className="p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-6">
                Add Class Assignment
              </h3>
              
              <form onSubmit={handleAddClass} className="space-y-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newClassData.classCode}
                    onChange={(e) => setNewClassData(prev => ({ ...prev, classCode: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                    required
                  >
                    <option value="">Select Class</option>
                    {availableClasses.map(cls => (
                      <option key={cls.classCode} value={cls.classCode}>
                        {cls.classCode} - {cls.course} Year {cls.year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newClassData.subject}
                    onChange={(e) => setNewClassData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                    required
                    disabled={!newClassData.classCode}
                  >
                    <option value="">Select Subject</option>
                    {newClassData.classCode && getClassSubjects(newClassData.classCode)
                      .filter((subject: any) => teacherData.subjects.includes(subject.name))
                      .map((subject: any) => (
                        <option key={subject.name} value={subject.name}>
                          {subject.name} (Assigned to: {subject.teacherName})
                        </option>
                      ))}
                  </select>
                  {!newClassData.classCode && (
                    <p className="text-xs text-gray-500">
                      Please select a class first
                    </p>
                  )}
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    className="flex-1"
                  >
                    Add Assignment
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddClass(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectTeacherDashboard;