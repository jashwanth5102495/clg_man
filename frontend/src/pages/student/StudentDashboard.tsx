import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, BookOpen, Settings, Eye, EyeOff } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';
import axios from 'axios';

interface StudentData {
  personalInfo: {
    name: string;
    dob: string;
    parentName: string;
    address: string;
    university: string;
    course: string;
    classCode: string;
  };
  attendance: {
    percentage: number;
    status: string;
    message?: string;
    fine?: number;
    needsAction?: boolean;
    records: any[];
  };
  marks: {
    internal: any[];
    semester: any[];
    averageInternal: number;
    averageSemester: number;
  };
  suggestions: string[];
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const errorToastShown = useRef(false);

  useEffect(() => {
    const loadStudentDashboard = async () => {
      try {
        const studentAuth = localStorage.getItem('studentAuth');
        if (!studentAuth) {
          if (!errorToastShown.current) {
            toast.error('Session expired, please log in again.');
            errorToastShown.current = true;
            setTimeout(() => navigate('/student'), 1200);
          }
          return;
        }

        const authData = JSON.parse(studentAuth);
        const response = await axios.get('/api/students/dashboard', {
          headers: { Authorization: `Bearer ${authData.token}` }
        });

        setStudentData(response.data);
        setLoading(false);
      } catch (error: any) {
        if (errorToastShown.current) return;
        errorToastShown.current = true;
        let message = 'Failed to load dashboard';
        if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
            message = 'Session expired, please log in again.';
          } else if (error.response.status === 404) {
            message = 'Student or class not found.';
          } else if (error.response.status === 500) {
            message = 'Server error, please try again later.';
          } else if (error.response.data?.message) {
            message = error.response.data.message;
          }
        }
        toast.error(message);
        setTimeout(() => navigate('/student'), 1200);
      }
    };

    loadStudentDashboard();
  }, [navigate]);

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const studentAuth = JSON.parse(localStorage.getItem('studentAuth') || '{}');
      await axios.put('/api/students/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${studentAuth.token}` }
      });

      toast.success('Password changed successfully!');
      setShowSettings(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentAuth');
    navigate('/student');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white text-xl">No student data found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <Header title="Student Dashboard" showLogout showHome />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Welcome, {studentData.personalInfo.name}!
            </h1>
            <p className="text-gray-400">
              {studentData.personalInfo.classCode} • {studentData.personalInfo.course} • {studentData.personalInfo.university}
            </p>
          </div>
          <Button
            icon={Settings}
            onClick={() => setShowSettings(true)}
            className="bg-gray-600 hover:bg-gray-700"
          >
            Settings
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 shadow-lg shadow-blue-500/10 bg-neutral-800">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4 shadow-md shadow-blue-500/20">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{studentData.attendance.percentage}%</p>
                <p className="text-gray-400">Attendance</p>
                <p className={`text-sm font-medium ${
                  studentData.attendance.status === 'Safe' ? 'text-green-400' :
                  studentData.attendance.status === 'Warning' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {studentData.attendance.status}
                </p>
                {studentData.attendance.fine && studentData.attendance.fine > 0 && (
                  <p className="text-red-400 text-xs font-bold">Fine: ₹{studentData.attendance.fine}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg shadow-green-500/10 bg-neutral-800">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4 shadow-md shadow-green-500/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{studentData.marks.averageInternal}%</p>
                <p className="text-gray-400">Internal Average</p>
                <p className={`text-sm font-medium ${studentData.marks.averageInternal >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {studentData.marks.averageInternal >= 50 ? 'Passing' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg shadow-purple-500/10 bg-neutral-800">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4 shadow-md shadow-purple-500/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{studentData.marks.averageSemester}%</p>
                <p className="text-gray-400">Semester Average</p>
                <p className={`text-sm font-medium ${studentData.marks.averageSemester >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {studentData.marks.averageSemester >= 50 ? 'Passing' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Attendance Warning */}
        {studentData.attendance.needsAction && (
          <Card className="p-6 mb-8 bg-red-900/20 border border-red-500/30">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-400 mb-2">⚠️ Attendance Alert</h3>
                <p className="text-red-200 mb-4">{studentData.attendance.message}</p>
                <div className="bg-red-800/30 p-4 rounded-lg">
                  <h4 className="text-red-300 font-semibold mb-2">Action Required:</h4>
                  <ul className="text-red-200 text-sm space-y-1">
                    <li>• Contact your Head of Department (HOD) immediately</li>
                    <li>• Discuss your attendance situation and improvement plan</li>
                    <li>• Pay the fine amount: ₹{studentData.attendance.fine}</li>
                    <li>• Ensure regular attendance going forward</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Personal Information */}
        <Card className="p-6 mb-8 bg-neutral-800">
          <h3 className="text-xl font-bold text-white mb-6">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Full Name</label>
                <p className="text-white">{studentData.personalInfo.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Date of Birth</label>
                <p className="text-white">{studentData.personalInfo.dob}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Parent Name</label>
                <p className="text-white">{studentData.personalInfo.parentName}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Address</label>
                <p className="text-white">{studentData.personalInfo.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Class Code</label>
                <p className="text-white">{studentData.personalInfo.classCode}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Course</label>
                <p className="text-white">{studentData.personalInfo.course} - {studentData.personalInfo.university}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance Details */}
        <Card className="p-6 mb-8 bg-neutral-800">
          <h3 className="text-xl font-bold text-white mb-6">Attendance Summary</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Subject-wise Attendance */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Subject-wise Attendance</h4>
              {studentData.attendance.records.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(
                    studentData.attendance.records.reduce((acc: any, record: any) => {
                      if (!acc[record.subject]) {
                        acc[record.subject] = { total: 0, present: 0 };
                      }
                      acc[record.subject].total++;
                      if (record.present) acc[record.subject].present++;
                      return acc;
                    }, {})
                  ).map(([subject, data]: [string, any]) => {
                    const percentage = Math.round((data.present / data.total) * 100);
                    return (
                      <div key={subject} className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-white">{subject}</span>
                          <span className={`font-bold ${
                            percentage >= 75 ? 'text-green-400' : 
                            percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {percentage}%
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Present: {data.present} / Total: {data.total}
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full ${
                              percentage >= 75 ? 'bg-green-500' : 
                              percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No attendance records found</p>
                </div>
              )}
            </div>

            {/* Absent Dates */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Recent Absent Dates</h4>
              {studentData.attendance.records.filter((record: any) => !record.present).length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {studentData.attendance.records
                    .filter((record: any) => !record.present)
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((record: any, index: number) => (
                      <div key={index} className="bg-red-900/30 border border-red-500/30 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-red-300 font-medium">{record.subject}</span>
                          <span className="text-red-200 text-sm">
                            {new Date(record.date).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-400 text-4xl mb-2">🎉</div>
                  <p className="text-green-400">Perfect attendance!</p>
                  <p className="text-gray-400 text-sm">No absent days recorded</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Marks Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Internal Marks */}
          <Card className="p-6 bg-neutral-800">
            <h3 className="text-xl font-bold text-white mb-6">Internal Marks</h3>
            {studentData.marks.internal.length > 0 ? (
              <div className="space-y-4">
                {studentData.marks.internal.map((mark: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{mark.subject}</p>
                      <p className="text-gray-400 text-sm">Total: {mark.totalMarks}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${mark.isPassed ? 'text-green-400' : 'text-red-400'}`}>
                        {mark.marks}/{mark.totalMarks}
                      </p>
                      <p className={`text-sm ${mark.isPassed ? 'text-green-400' : 'text-red-400'}`}>
                        {mark.isPassed ? 'Pass' : 'Fail'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No internal marks recorded</p>
              </div>
            )}
          </Card>

          {/* Semester Marks */}
          <Card className="p-6 bg-neutral-800">
            <h3 className="text-xl font-bold text-white mb-6">Semester Marks</h3>
            {studentData.marks.semester.length > 0 ? (
              <div className="space-y-4">
                {studentData.marks.semester.map((mark: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{mark.subject}</p>
                      <p className="text-gray-400 text-sm">Total: {mark.totalMarks}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${mark.isPassed ? 'text-green-400' : 'text-red-400'}`}>
                        {mark.marks}/{mark.totalMarks}
                      </p>
                      <p className={`text-sm ${mark.isPassed ? 'text-green-400' : 'text-red-400'}`}>
                        {mark.isPassed ? 'Pass' : 'Fail'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No semester marks recorded</p>
              </div>
            )}
          </Card>
        </div>

        {/* Course Suggestions */}
        {studentData.suggestions.length > 0 && (
          <Card className="p-6 bg-neutral-800">
            <h3 className="text-xl font-bold text-white mb-6">Course Suggestions</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {studentData.suggestions.map((suggestion: string, index: number) => (
                <div key={index} className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 font-medium">{suggestion}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <Card className="p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-white">Change Password</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={() => setShowSettings(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={changingPassword}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;