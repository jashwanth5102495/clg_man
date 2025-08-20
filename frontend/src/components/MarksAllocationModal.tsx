import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Card from './UI/Card';
import Button from './UI/Button';

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  marks: string;
}

interface MarksAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  classCode: string;
  onMarksAllocated: () => void;
}

const MarksAllocationModal: React.FC<MarksAllocationModalProps> = ({
  isOpen,
  onClose,
  classCode,
  onMarksAllocated
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [marksData, setMarksData] = useState({
    subject: '',
    maxMarks: '100',
    type: 'internal' // 'internal' or 'semester'
  });

  useEffect(() => {
    if (isOpen) {
      loadStudentsAndSubjects();
    }
  }, [isOpen]);

  const loadStudentsAndSubjects = async () => {
    try {
      setLoading(true);
      
      // Try multiple token storage locations
      let token = null;
      let authData = null;
      
      // Check teacherAuth first
      const teacherAuth = localStorage.getItem('teacherAuth');
      if (teacherAuth) {
        try {
          authData = JSON.parse(teacherAuth);
          token = authData.token;
        } catch (e) {
          console.warn('Failed to parse teacherAuth:', e);
        }
      }
      
      // Fallback to regular token
      if (!token) {
        token = localStorage.getItem('token');
      }
      
      if (!token) {
        toast.error('No authentication found. Please login again.');
        return;
      }
      
      // Set axios defaults
      axios.defaults.baseURL = 'http://localhost:5000';
      
      console.log('Loading class data for marks allocation...');
      
      // Get class data first
      const classDoc = await axios.get('/api/classes/my-class', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Class data loaded:', classDoc.data);

      if (classDoc.data.class) {
        // Set subjects from class
        setClassSubjects(classDoc.data.class.subjects || []);
        
        // Load students
        const response = await axios.get(`/api/students/by-class/${classDoc.data.class.classCode}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Students loaded for marks:', response.data);

        if (response.data.students && response.data.students.length > 0) {
          const studentsWithMarks = response.data.students.map((student: any) => ({
            _id: student._id,
            name: student.name,
            rollNumber: student.rollNumber,
            marks: '' // Empty marks field for input
          }));

          setStudents(studentsWithMarks);
          console.log('Students prepared for marks allocation:', studentsWithMarks.length);
        } else {
          toast.error('No students found in this class');
        }
      } else {
        toast.error('Class information not found');
      }
    } catch (error: any) {
      console.error('Error loading students and subjects:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please login again.');
        localStorage.removeItem('teacherAuth');
        localStorage.removeItem('token');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load data. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStudentMarks = (studentId: string, marks: string) => {
    setStudents(prev => prev.map(student => 
      student._id === studentId 
        ? { ...student, marks }
        : student
    ));
  };

  const handleSubmit = async () => {
    if (!marksData.subject) {
      toast.error('Please select a subject');
      return;
    }

    // Get students with marks entered
    const studentsWithMarks = students.filter(student => student.marks.trim() !== '');
    
    if (studentsWithMarks.length === 0) {
      toast.error('Please enter marks for at least one student');
      return;
    }

    const maxMarks = parseFloat(marksData.maxMarks);
    
    // Validate all marks
    for (const student of studentsWithMarks) {
      const marks = parseFloat(student.marks);
      if (isNaN(marks) || marks < 0 || marks > maxMarks) {
        toast.error(`Invalid marks for ${student.name}. Marks must be between 0 and ${maxMarks}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      // Try multiple token storage locations
      let token = null;
      let authData = null;
      
      // Check teacherAuth first
      const teacherAuth = localStorage.getItem('teacherAuth');
      if (teacherAuth) {
        try {
          authData = JSON.parse(teacherAuth);
          token = authData.token;
        } catch (e) {
          console.warn('Failed to parse teacherAuth:', e);
        }
      }
      
      // Fallback to regular token
      if (!token) {
        token = localStorage.getItem('token');
      }
      
      if (!token) {
        toast.error('No authentication found. Please login again.');
        return;
      }
      
      console.log('Submitting marks for students:', studentsWithMarks.length);

      // Get class data first to get classId
      const classResponse = await axios.get('/api/classes/my-class', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!classResponse.data.class || !classResponse.data.class.classId) {
        toast.error('Class information not found. Please try again.');
        return;
      }

      const classCode = classResponse.data.class.classCode;

      // Prepare bulk marks data
      const studentsMarks = studentsWithMarks.map(student => ({
        studentId: student._id,
        marks: parseFloat(student.marks)
      }));

      // Use bulk marks allocation endpoint
      const response = await axios.post(`/api/students/bulk-marks/${classCode}`, {
        subject: marksData.subject,
        type: marksData.type,
        maxMarks: maxMarks,
        studentsMarks: studentsMarks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Bulk marks allocation response:', response.data);

      if (response.data.errors && response.data.errors.length > 0) {
        console.warn('Some errors occurred:', response.data.errors);
        toast.success(`Marks allocated to ${response.data.studentsUpdated} students. ${response.data.errors.length} errors occurred.`);
        
        // Show first few errors
        response.data.errors.slice(0, 3).forEach((error: string) => {
          toast.error(error, { duration: 5000 });
        });
      } else {
        toast.success(`Marks allocated successfully to ${response.data.studentsUpdated} students!`);
      }
      
      // Reset form
      setStudents(prev => prev.map(student => ({ ...student, marks: '' })));
      setMarksData({
        subject: '',
        maxMarks: '100',
        type: 'internal'
      });
      
      onMarksAllocated();
      onClose();
    } catch (error: any) {
      console.error('Error allocating marks:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else if (error.response?.status === 404) {
        toast.error('Class or students not found. Please refresh and try again.');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Invalid data provided.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to allocate marks. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillAllMarks = (marks: string) => {
    setStudents(prev => prev.map(student => ({ ...student, marks })));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-700 px-8 py-6 bg-neutral-900">
          <div>
            <h2 className="text-2xl font-bold text-white">Allocate Marks</h2>
            <p className="text-gray-400 mt-1">Enter marks for each student</p>
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
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading students and subjects...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Marks Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Marks Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="internal"
                        checked={marksData.type === 'internal'}
                        onChange={e => setMarksData(prev => ({ ...prev, type: e.target.value }))}
                        className="mr-2 accent-green-500"
                      />
                      <span className="text-white text-sm">Internal</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="semester"
                        checked={marksData.type === 'semester'}
                        onChange={e => setMarksData(prev => ({ ...prev, type: e.target.value }))}
                        className="mr-2 accent-green-500"
                      />
                      <span className="text-white text-sm">Semester</span>
                    </label>
                  </div>
                </div>
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
                  <select
                    value={marksData.subject}
                    onChange={e => setMarksData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    {classSubjects.map((subject, idx) => (
                      <option key={idx} value={subject.name || subject}>
                        {subject.name || subject}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Maximum Marks */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Marks</label>
                  <input
                    type="number"
                    value={marksData.maxMarks}
                    onChange={e => setMarksData(prev => ({ ...prev, maxMarks: e.target.value }))}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500"
                    placeholder="Max marks"
                    min="1"
                  />
                </div>
              </div>
              {/* Quick Fill */}
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-gray-300 text-sm">Quick fill:</span>
                {[0, 25, 50, 75, 100].map(val => (
                  <Button
                    key={val}
                    onClick={() => fillAllMarks(val.toString())}
                    variant="secondary"
                    size="sm"
                    className="!px-4"
                  >
                    {val}
                  </Button>
                ))}
                <Button
                  onClick={() => fillAllMarks('')}
                  variant="danger"
                  size="sm"
                  className="!px-4"
                >
                  Clear All
                </Button>
              </div>
              {/* Students List */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Students ({students.length})</h3>
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400">No students found</div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {students.map(student => (
                      <Card key={student._id} className="flex items-center justify-between p-4 border-2 border-gray-700 bg-neutral-800">
                        <div className="flex-1">
                          <div className="font-medium text-white">{student.name}</div>
                          <div className="text-sm text-gray-400">{student.rollNumber}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={student.marks}
                            onChange={e => updateStudentMarks(student._id, e.target.value)}
                            className="w-20 border border-gray-600 rounded-lg px-2 py-1 bg-gray-700 text-white text-center focus:border-green-500 focus:ring-2 focus:ring-green-500"
                            placeholder="0"
                            min="0"
                            max={marksData.maxMarks}
                          />
                          <span className="text-gray-400 text-sm">/ {marksData.maxMarks}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              {/* Info Box */}
              <Card className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2">💡 Instructions:</h4>
                <ul className="text-blue-300 text-sm space-y-1">
                  <li>• Select marks type (Internal/Semester) and subject</li>
                  <li>• Enter marks for each student individually</li>
                  <li>• Use quick fill buttons to set same marks for all students</li>
                  <li>• Leave marks empty for students you don't want to grade</li>
                  <li>• Only students with marks entered will be updated</li>
                </ul>
              </Card>
            </div>
          )}
        </div>
        {/* Modal Footer */}
        <div className="px-8 py-6 border-t border-gray-700 bg-neutral-900 flex justify-between items-center">
          <div className="text-gray-400 text-sm">
            {students.filter(s => s.marks.trim() !== '').length} of {students.length} students have marks entered
          </div>
          <div className="flex gap-4">
            <Button
              onClick={onClose}
              variant="secondary"
              size="md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || loading || !marksData.subject}
              variant="primary"
              size="md"
            >
              {submitting ? 'Allocating...' : 'Allocate Marks'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MarksAllocationModal;