import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Card from './UI/Card';
import Button from './UI/Button';

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  present?: boolean;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  classCode: string;
  onAttendanceTaken: () => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  subject,
  classCode,
  onAttendanceTaken
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      loadStudents();
    }
  }, [isOpen, classCode]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication found. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('teacher');
          window.location.href = '/teacher';
        }, 2000);
        return;
      }

      console.log('Loading students for attendance with classCode:', classCode);
      const response = await axios.get(`/api/students/class/${classCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Students response:', response.data);

      if (response.data.students && response.data.students.length > 0) {
        const studentsWithAttendance = response.data.students.map((student: any) => ({
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          present: true // Default to present
        }));

        setStudents(studentsWithAttendance);
        console.log('Students loaded successfully:', studentsWithAttendance.length);
      } else {
        toast.error('No students found in this class');
      }
    } catch (error: any) {
      console.error('Error loading students:', error);
      console.error('Error details:', error.response?.data);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Redirecting to login...');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('teacher');
          window.location.href = '/teacher';
        }, 2000);
      } else {
        toast.error(error.response?.data?.message || 'Failed to load students. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setStudents(prev => prev.map(student => 
      student._id === studentId 
        ? { ...student, present: !student.present }
        : student
    ));
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(student => ({ ...student, present: true })));
  };

  const markAllAbsent = () => {
    setStudents(prev => prev.map(student => ({ ...student, present: false })));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication found. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('teacher');
          window.location.href = '/teacher';
        }, 2000);
        return;
      }

      const attendanceData = students.map(student => ({
        studentId: student._id,
        present: student.present
      }));

      console.log('Submitting attendance:', {
        subject,
        date: selectedDate,
        classCode,
        attendanceData: attendanceData.length,
        presentCount: attendanceData.filter(s => s.present).length
      });

      const response = await axios.post('/api/attendance/take', {
        subject,
        date: selectedDate,
        classCode,
        attendanceData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Attendance response:', response.data);
      toast.success(`Attendance recorded successfully! ${response.data.presentCount}/${response.data.totalStudents} students present.`);
      onAttendanceTaken();
      onClose();
    } catch (error: any) {
      console.error('Error taking attendance:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already taken')) {
        toast.error('Attendance already taken for this subject on this date');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Redirecting to login...');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('teacher');
          window.location.href = '/teacher';
        }, 2000);
      } else if (error.response?.status === 404) {
        toast.error('Class not found. Please refresh and try again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to record attendance. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const presentCount = students.filter(s => s.present).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-700 px-8 py-6 bg-neutral-900">
          <div>
            <h2 className="text-2xl font-bold text-white">Take Attendance</h2>
            <p className="text-gray-400 mt-1">Subject: {subject}</p>
          </div>
          <Button
            onClick={onClose}
            variant="secondary"
            size="lg"
            className="!px-4 !py-2 text-xl font-bold"
          >
            ×
          </Button>
        </div>
        {/* Modal Body */}
        <div className="px-8 py-6 max-h-[60vh] overflow-y-auto bg-neutral-900">
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-2 md:ml-auto">
              <Button
                onClick={markAllPresent}
                variant="success"
                size="md"
              >
                Mark All Present
              </Button>
              <Button
                onClick={markAllAbsent}
                variant="danger"
                size="md"
              >
                Mark All Absent
              </Button>
            </div>
          </div>
          <div className="flex gap-6 text-sm text-gray-300 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Present: {presentCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Absent: {absentCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Total: {students.length}</span>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading students...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map(student => (
                <Card
                  key={student._id}
                  className={`p-4 cursor-pointer transition-all border-2 flex flex-col justify-between ${
                    student.present
                      ? 'border-green-600 bg-green-900/30 hover:bg-green-900/40'
                      : 'border-red-600 bg-red-900/30 hover:bg-red-900/40'
                  }`}
                  onClick={() => toggleAttendance(student._id)}
                  hover
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{student.name}</div>
                      <div className="text-sm text-gray-400">{student.rollNumber}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        student.present ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {student.present ? 'Present' : 'Absent'}
                      </span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        student.present
                          ? 'bg-green-500 border-green-500'
                          : 'bg-red-500 border-red-500'
                      }`}>
                        {student.present ? (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        {/* Modal Footer */}
        <div className="px-8 py-6 border-t border-gray-700 bg-neutral-900 flex justify-end gap-4">
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || loading}
            variant="primary"
            size="md"
          >
            {submitting ? 'Recording...' : 'Record Attendance'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AttendanceModal;