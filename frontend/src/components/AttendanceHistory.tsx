import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Card from './UI/Card';
import Button from './UI/Button';

interface AttendanceRecord {
  _id: string;
  subject: string;
  date: string;
  teacherName: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  students: Array<{
    studentId: string;
    rollNumber: string;
    name: string;
    present: boolean;
  }>;
}

interface AttendanceHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  classCode: string;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  isOpen,
  onClose,
  classCode
}) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAttendanceHistory();
    }
  }, [isOpen]);

  const loadAttendanceHistory = async () => {
    try {
      setLoading(true);
      const teacherAuth = localStorage.getItem('teacherAuth');
      if (!teacherAuth) return;

      const authData = JSON.parse(teacherAuth);
      const response = await axios.get(`/api/attendance/class/${classCode}`, {
        headers: { Authorization: `Bearer ${authData.token}` }
      });

      setAttendanceRecords(response.data.attendanceRecords || []);
    } catch (error: any) {
      console.error('Error loading attendance history:', error);
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-700 px-8 py-6 bg-neutral-900">
          <h2 className="text-2xl font-bold text-white">Attendance History</h2>
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
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading attendance history...</div>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-white mb-2">No Attendance Records</h3>
              <p className="text-gray-400">No attendance has been taken yet for this class.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Subject</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Total Students</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Present</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Absent</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Percentage</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => {
                    const percentage = Math.round((record.presentCount / record.totalStudents) * 100);
                    return (
                      <tr key={record._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-white">{formatDate(record.date)}</td>
                        <td className="py-3 px-4 text-white">{record.subject}</td>
                        <td className="py-3 px-4 text-white">{record.totalStudents}</td>
                        <td className="py-3 px-4">
                          <span className="text-green-400 font-medium">{record.presentCount}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-red-400 font-medium">{record.absentCount}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            percentage >= 75 ? 'text-green-400' : 
                            percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            onClick={() => handleViewDetails(record)}
                            variant="primary"
                            size="sm"
                            className="!px-3 !py-1"
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Modal Footer */}
        <div className="px-8 py-6 border-t border-gray-700 bg-neutral-900 flex justify-end">
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
          >
            Close
          </Button>
        </div>
      </Card>
      {/* Details Modal */}
      {showDetails && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden border border-gray-600 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-600 px-8 py-6 bg-neutral-900">
              <div>
                <h3 className="text-xl font-bold text-white">Attendance Details</h3>
                <p className="text-gray-300 mt-1">
                  {selectedRecord.subject} - {formatDate(selectedRecord.date)}
                </p>
              </div>
              <Button
                onClick={() => setShowDetails(false)}
                variant="secondary"
                size="lg"
                className="!px-4 !py-2 text-xl font-bold"
              >
                ×
              </Button>
            </div>
            <div className="px-8 py-6 max-h-96 overflow-y-auto bg-neutral-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRecord.students.map((student) => (
                  <Card
                    key={student.studentId}
                    className={`p-4 flex flex-col justify-between border-2 ${
                      student.present
                        ? 'border-green-600 bg-green-900/30'
                        : 'border-red-600 bg-red-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{student.name}</div>
                        <div className="text-sm text-gray-400">{student.rollNumber}</div>
                      </div>
                      <span className={`text-sm font-medium ${
                        student.present ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {student.present ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;