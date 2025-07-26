import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface StudentOverviewProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

interface StudentDetails {
  _id: string;
  name: string;
  rollNumber: string;
  dob: string;
  parentName: string;
  address: string;
  classCode: string;
  credentials: {
    username: string;
    password: string;
  };
  attendance: Array<{
    subject: string;
    date: string;
    present: boolean;
    formattedDate: string;
  }>;
  internalMarks: Array<{
    subject: string;
    marks: number;
    totalMarks: number;
    isPassed: boolean;
  }>;
  semesterMarks: Array<{
    subject: string;
    marks: number;
    totalMarks: number;
    isPassed: boolean;
  }>;
  attendancePercentage: number;
  attendanceStatus: string;
  averageInternal: number;
  averageSemester: number;
}

const StudentOverviewModal: React.FC<StudentOverviewProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName
}) => {
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'marks'>('overview');

  useEffect(() => {
    if (isOpen && studentId) {
      loadStudentDetails();
    }
  }, [isOpen, studentId]);

  const loadStudentDetails = async () => {
    try {
      setLoading(true);
      const teacherAuth = localStorage.getItem('teacherAuth');
      if (!teacherAuth) return;

      const authData = JSON.parse(teacherAuth);
      const response = await axios.get(`/api/students/details/${studentId}`, {
        headers: { Authorization: `Bearer ${authData.token}` }
      });

      setStudentDetails(response.data.student);
    } catch (error: any) {
      console.error('Error loading student details:', error);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getAttendanceBySubject = () => {
    if (!studentDetails) return {};
    
    return studentDetails.attendance.reduce((acc: any, record) => {
      if (!acc[record.subject]) {
        acc[record.subject] = { total: 0, present: 0, absent: 0 };
      }
      acc[record.subject].total++;
      if (record.present) {
        acc[record.subject].present++;
      } else {
        acc[record.subject].absent++;
      }
      return acc;
    }, {});
  };

  const getAbsentDates = () => {
    if (!studentDetails) return [];
    
    return studentDetails.attendance
      .filter(record => !record.present)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Student Overview</h2>
              <p className="text-gray-300 mt-1">{studentName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 flex space-x-1 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'attendance'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('marks')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'marks'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Marks
            </button>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto bg-gray-900">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading student details...</div>
            </div>
          ) : !studentDetails ? (
            <div className="text-center py-8">
              <div className="text-red-400">Failed to load student details</div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Full Name</label>
                        <p className="text-white">{studentDetails.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Roll Number</label>
                        <p className="text-white">{studentDetails.rollNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Date of Birth</label>
                        <p className="text-white">{studentDetails.dob}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Parent Name</label>
                        <p className="text-white">{studentDetails.parentName}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400">Address</label>
                        <p className="text-white">{studentDetails.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Login Credentials */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Login Credentials</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Username</label>
                        <p className="text-green-400 font-mono">{studentDetails.credentials.username}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400">Password</label>
                        <p className="text-green-400 font-mono">{studentDetails.credentials.password}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-400">
                        {studentDetails.attendancePercentage || 0}%
                      </div>
                      <div className="text-sm text-gray-400">Attendance</div>
                      <div className={`text-xs font-medium mt-1 ${
                        (studentDetails.attendancePercentage || 0) >= 75 ? 'text-green-400' : 
                        (studentDetails.attendancePercentage || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {(studentDetails.attendancePercentage || 0) >= 75 ? 'Good' : 
                         (studentDetails.attendancePercentage || 0) >= 50 ? 'Warning' : 'Critical'}
                      </div>
                    </div>
                    <div className="bg-green-900/30 border border-green-600/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-400">
                        {studentDetails.averageInternal || 0}%
                      </div>
                      <div className="text-sm text-gray-400">Internal Average</div>
                      <div className={`text-xs font-medium mt-1 ${
                        (studentDetails.averageInternal || 0) >= 50 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(studentDetails.averageInternal || 0) >= 50 ? 'Passing' : 'Needs Improvement'}
                      </div>
                    </div>
                    <div className="bg-purple-900/30 border border-purple-600/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">
                        {studentDetails.averageSemester || 0}%
                      </div>
                      <div className="text-sm text-gray-400">Semester Average</div>
                      <div className={`text-xs font-medium mt-1 ${
                        (studentDetails.averageSemester || 0) >= 50 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(studentDetails.averageSemester || 0) >= 50 ? 'Passing' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  {/* Subject-wise Attendance */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Subject-wise Attendance</h3>
                    <div className="space-y-4">
                      {Object.entries(getAttendanceBySubject()).map(([subject, data]: [string, any]) => {
                        const percentage = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
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
                            <div className="text-sm text-gray-400 mb-2">
                              Present: {data.present} / Total: {data.total} / Absent: {data.absent}
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
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
                  </div>

                  {/* Recent Absent Dates */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Absent Dates</h3>
                    {getAbsentDates().length > 0 ? (
                      <div className="space-y-2">
                        {getAbsentDates().map((record, index) => (
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
              )}

              {/* Marks Tab */}
              {activeTab === 'marks' && (
                <div className="space-y-6">
                  {/* Internal Marks */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Internal Marks</h3>
                    {studentDetails.internalMarks.length > 0 ? (
                      <div className="space-y-3">
                        {studentDetails.internalMarks.map((mark, index) => (
                          <div key={index} className="bg-gray-700 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium text-white">{mark.subject}</span>
                                <div className="text-sm text-gray-400">Total: {mark.totalMarks}</div>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  mark.isPassed ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {mark.marks}/{mark.totalMarks}
                                </div>
                                <div className={`text-sm ${
                                  mark.isPassed ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {mark.isPassed ? 'Pass' : 'Fail'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-2">📝</div>
                        <p className="text-gray-400">No internal marks recorded</p>
                      </div>
                    )}
                  </div>

                  {/* Semester Marks */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Semester Marks</h3>
                    {studentDetails.semesterMarks.length > 0 ? (
                      <div className="space-y-3">
                        {studentDetails.semesterMarks.map((mark, index) => (
                          <div key={index} className="bg-gray-700 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium text-white">{mark.subject}</span>
                                <div className="text-sm text-gray-400">Total: {mark.totalMarks}</div>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  mark.isPassed ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {mark.marks}/{mark.totalMarks}
                                </div>
                                <div className={`text-sm ${
                                  mark.isPassed ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {mark.isPassed ? 'Pass' : 'Fail'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-2">📊</div>
                        <p className="text-gray-400">No semester marks recorded</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentOverviewModal;