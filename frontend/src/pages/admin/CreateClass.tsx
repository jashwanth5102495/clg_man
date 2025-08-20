import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Users, BookOpen, School, Plus, X } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Subject {
  name: string;
  teacherId: string;
}

const CreateClass: React.FC = () => {
  const navigate = useNavigate();
  const [classData, setClassData] = useState({
    classStrength: '',
    boys: '',
    girls: '',
    course: '',
    university: 'BCU',
    year: '',
    semester: ''
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState({ name: '', teacherId: '' });
  const [customSubjectChecked, setCustomSubjectChecked] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [isLabSelected, setIsLabSelected] = useState(false);
  const [labSubjectName, setLabSubjectName] = useState('');
  const [facultyList, setFacultyList] = useState<any[]>([]);

  useEffect(() => {
    const fetchFacultyList = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/faculty', {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Faculty List:', response.data.faculty);
        setFacultyList(response.data.faculty);
      } catch (error) {
        toast.error('Failed to load faculty list');
      }
    };
    fetchFacultyList();
  }, []);

  const availableSubjects = [
    'Mathematics', 'Programming', 'Database', 'Networks', 'AI/ML', 'Linux',
    'Data Structures', 'Operating Systems', 'Software Engineering', 'Web Development',
    'Computer Graphics', 'Compiler Design', 'Theory of Computation', 'Digital Electronics',
    'LAB'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate boys + girls = class strength
    const total = parseInt(classData.boys) + parseInt(classData.girls);
    if (total !== parseInt(classData.classStrength)) {
      toast.error('Boys + Girls must equal Class Strength');
      return;
    }

    if (subjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }



    // Validate subjects array
    for (const subject of subjects) {
      if (!subject.name || !subject.teacherId) {
        toast.error(`Invalid subject data: ${subject.name || 'Unnamed subject'} is missing a teacher`);
        return;
      }
    }

    try {
      const payload = {
        ...classData,
        subjects,
        classStrength: parseInt(classData.classStrength),
        boys: parseInt(classData.boys),
        girls: parseInt(classData.girls),
        year: parseInt(classData.year),
        semester: parseInt(classData.semester)
      };
      console.log('Sending payload:', payload); // Debug payload
      const response = await axios.post('/api/classes/create', payload);
      const { classId } = response.data;
      toast.success(`Class created! Class ID: ${classId}`);
      navigate(`/admin/class/${classId}`);
    } catch (error: any) {
      console.error('Create class error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create class');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setClassData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'course') {
        newData.year = '';
        newData.semester = '';
      }
      if (field === 'year') {
        newData.semester = '';
      }
      return newData;
    });
  };

  const addSubject = () => {
    let subjectName = customSubjectChecked ? customSubjectName : newSubject.name;
    
    // Handle LAB selection
    if (newSubject.name === 'LAB') {
      if (!labSubjectName.trim()) {
        toast.error('Please enter the subject name for the lab');
        return;
      }
      subjectName = `${labSubjectName} LAB`;
    }
    
    if (!subjectName.trim()) {
      toast.error('Please provide a subject name');
      return;
    }
    if (!newSubject.teacherId) {
      toast.error('Please select a teacher for the subject');
      return;
    }
    if (subjects.some(s => s.name === subjectName)) {
      toast.error('Subject already exists');
      return;
    }
    
    const subjectData = {
      name: subjectName,
      teacherId: newSubject.teacherId,
      isLab: newSubject.name === 'LAB',
      duration: newSubject.name === 'LAB' ? 2 : 1 // 2 hours for lab, 1 hour for regular subjects
    };
    
    setSubjects(prev => [...prev, subjectData]);
    setNewSubject({ name: '', teacherId: '' });
    setCustomSubjectName('');
    setCustomSubjectChecked(false);
    setIsLabSelected(false);
    setLabSubjectName('');
    toast.success('Subject added successfully');
  };

  const removeSubject = (index: number) => {
    setSubjects(prev => prev.filter((_, i) => i !== index));
  };

  // Get available years based on course
  const getAvailableYears = () => {
    if (classData.course === 'MCA') {
      return [
        { value: '1', label: '1st Year' },
        { value: '2', label: '2nd Year' }
      ];
    } else if (classData.course === 'BCA') {
      return [
        { value: '1', label: '1st Year' },
        { value: '2', label: '2nd Year' },
        { value: '3', label: '3rd Year' }
      ];
    }
    return [];
  };

  // Get available semesters based on course and year
  const getAvailableSemesters = () => {
    if (!classData.course || !classData.year) return [];
    const year = parseInt(classData.year);
    const semesters = [];
    if (classData.course === 'MCA') {
      if (year === 1) {
        semesters.push(
          { value: '1', label: '1st Semester' },
          { value: '2', label: '2nd Semester' }
        );
      } else if (year === 2) {
        semesters.push(
          { value: '3', label: '3rd Semester' },
          { value: '4', label: '4th Semester' }
        );
      }
    } else if (classData.course === 'BCA') {
      if (year === 1) {
        semesters.push(
          { value: '1', label: '1st Semester' },
          { value: '2', label: '2nd Semester' }
        );
      } else if (year === 2) {
        semesters.push(
          { value: '3', label: '3rd Semester' },
          { value: '4', label: '4th Semester' }
        );
      } else if (year === 3) {
        semesters.push(
          { value: '5', label: '5th Semester' },
          { value: '6', label: '6th Semester' }
        );
      }
    }
    return semesters;
  };

  return (
    <div className="min-h-screen bg-neutral-900">
      <Header title="Create New Class" showBack backPath="/admin/dashboard" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 bg-neutral-800">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <School className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Create New Class
            </h1>
            <p className="text-gray-400">
              Set up a new class with subjects and teachers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Class Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Class Information
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <Input
                  label="Class Strength"
                  type="number"
                  value={classData.classStrength}
                  onChange={(e) => handleInputChange('classStrength', e.target.value)}
                  required
                />
                <Input
                  label="Number of Boys"
                  type="number"
                  value={classData.boys}
                  onChange={(e) => handleInputChange('boys', e.target.value)}
                  required
                />
                <Input
                  label="Number of Girls"
                  type="number"
                  value={classData.girls}
                  onChange={(e) => handleInputChange('girls', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Course Details */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Course Details
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classData.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                    required
                  >
                    <option value="">Select Course</option>
                    <option value="MCA">MCA (Master of Computer Applications)</option>
                    <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">
                    University <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classData.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                    required
                  >
                    <option value="BCU">BCU (Bengaluru City University)</option>
                    <option value="BNU">BNU (Bengaluru North University)</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                    required
                    disabled={!classData.course}
                  >
                    <option value="">Select Year</option>
                    {getAvailableYears().map(year => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                  {!classData.course && (
                    <p className="text-xs text-gray-500">
                      Please select a course first
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classData.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                    required
                    disabled={!classData.course || !classData.year}
                  >
                    <option value="">Select Semester</option>
                    {getAvailableSemesters().map(semester => (
                      <option key={semester.value} value={semester.value}>
                        {semester.label}
                      </option>
                    ))}
                  </select>
                  {(!classData.course || !classData.year) && (
                    <p className="text-xs text-gray-500">
                      Please select course and year first
                    </p>
                  )}
                </div>
              </div>
            </div>



            {/* Subjects and Teachers */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Subjects and Teachers
              </h3>
              
              {/* Add Subject */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Subject
                  </label>
                  <select
                    value={customSubjectChecked ? '' : newSubject.name}
                    onChange={(e) => {
                      setNewSubject(prev => ({ ...prev, name: e.target.value }));
                      setIsLabSelected(e.target.value === 'LAB');
                      if (e.target.value !== 'LAB') {
                        setLabSubjectName('');
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                    disabled={customSubjectChecked}
                  >
                    <option value="">Select Subject</option>
                    {availableSubjects.filter(subject => 
                      !subjects.some(s => s.name === subject || (subject === 'LAB' && s.name.includes('LAB')))
                    ).map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="customSubjectCheckbox"
                      checked={customSubjectChecked}
                      onChange={e => {
                        setCustomSubjectChecked(e.target.checked);
                        setCustomSubjectName('');
                        setNewSubject(prev => ({ ...prev, name: '' }));
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="customSubjectCheckbox" className="text-sm text-gray-300">Other Subject</label>
                  </div>
                  {customSubjectChecked && (
                    <input
                      type="text"
                      className="w-full mt-2 px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Enter custom subject name"
                      value={customSubjectName}
                      onChange={e => setCustomSubjectName(e.target.value)}
                    />
                  )}
                  {isLabSelected && (
                    <input
                      type="text"
                      className="w-full mt-2 px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Enter subject name for lab (e.g., Programming, Database)"
                      value={labSubjectName}
                      onChange={e => setLabSubjectName(e.target.value)}
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Teacher
                  </label>
                  <select
                    value={newSubject.teacherId}
                    onChange={e => setNewSubject(prev => ({ ...prev, teacherId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">Select Teacher</option>
                    {facultyList.map(faculty => (
                      <option key={faculty.user._id} value={faculty.user._id}>
                        {faculty.name} ({faculty.collegeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addSubject}
                    icon={Plus}
                    className="w-full"
                  >
                    Add Subject
                  </Button>
                </div>
              </div>

              {/* Subjects List */}
              {subjects.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-white">Added Subjects:</h4>
                  <div className="grid gap-3">
                    {subjects.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div>
                          <span className="font-medium text-white">{subject.name}</span>
                          <span className="text-gray-300 ml-2">
                            - {facultyList.find(f => f.user._id === subject.teacherId)?.name || 'Unknown'}
                          </span>
                          {subject.isLab && (
                            <span className="text-green-400 ml-2 text-sm">
                              (Lab - {subject.duration}hrs)
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeSubject(index)}
                          icon={X}
                          variant="danger"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                icon={Save}
                size="lg"
              >
                Create Class
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateClass;