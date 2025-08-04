import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Users, BookOpen, School, Key, Plus, X } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import toast from 'react-hot-toast';

interface SubjectTeacher {
  subject: string;
  teacherName: string;
}

const CreateClass: React.FC = () => {
  const navigate = useNavigate();
  const [classData, setClassData] = useState({
    classStrength: '',
    boys: '',
    girls: '',
    courseName: '',
    university: 'BCU',
    year: '',
    semester: '',
    teacherName: '',
    username: '',
    password: ''
  });

  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacher[]>([]);
  const [newSubjectTeacher, setNewSubjectTeacher] = useState({ subject: '', teacherName: '' });

  const availableSubjects = [
    'Mathematics', 'Programming', 'Database', 'Networks', 'AI/ML', 'Linux',
    'Data Structures', 'Operating Systems', 'Software Engineering', 'Web Development'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate class code
    const classCode = `${classData.university}-${classData.courseName}-${classData.year}-SEM${classData.semester}`;
    
    // In production, this would call your backend API
    const classInfo = {
      ...classData,
      classCode,
      subjectTeachers,
      createdAt: new Date().toISOString()
    };
    
    // Mock save to localStorage (in production, save to MongoDB)
    localStorage.setItem('newClass', JSON.stringify(classInfo));
    localStorage.setItem(`class_${classCode}_subjects`, JSON.stringify(subjectTeachers));
    
    toast.success(`Class created successfully! Class Code: ${classCode}`);
    navigate('/teacher/dashboard');
  };

  const handleInputChange = (field: string, value: string) => {
    setClassData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset year and semester when course changes
      if (field === 'courseName') {
        newData.year = '';
        newData.semester = '';
      }
      
      // Reset semester when year changes
      if (field === 'year') {
        newData.semester = '';
      }
      
      return newData;
    });
  };

  const addSubjectTeacher = () => {
    if (!newSubjectTeacher.subject || !newSubjectTeacher.teacherName) {
      toast.error('Please fill in both subject and teacher name');
      return;
    }

    if (subjectTeachers.some(st => st.subject === newSubjectTeacher.subject)) {
      toast.error('Subject already assigned to a teacher');
      return;
    }

    setSubjectTeachers(prev => [...prev, newSubjectTeacher]);
    setNewSubjectTeacher({ subject: '', teacherName: '' });
    toast.success('Subject teacher added successfully');
  };

  const removeSubjectTeacher = (index: number) => {
    setSubjectTeachers(prev => prev.filter((_, i) => i !== index));
  };

  // Get available years based on course
  const getAvailableYears = () => {
    if (classData.courseName === 'MCA') {
      return [
        { value: '1', label: '1st Year' },
        { value: '2', label: '2nd Year' }
      ];
    } else if (classData.courseName === 'BCA') {
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
    if (!classData.courseName || !classData.year) return [];
    
    const year = parseInt(classData.year);
    const semesters = [];
    
    if (classData.courseName === 'MCA') {
      // MCA: 2 years, 4 semesters
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
    } else if (classData.courseName === 'BCA') {
      // BCA: 3 years, 6 semesters
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Header title="Create New Class" showBack backPath="/teacher" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <School className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Create New Class
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Set up your class with student information, subjects, and credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Class Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Course Details
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classData.courseName}
                    onChange={(e) => handleInputChange('courseName', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    required
                  >
                    <option value="">Select Course</option>
                    <option value="MCA">MCA (Master of Computer Applications)</option>
                    <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    University <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classData.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    required
                  >
                    <option value="BCU">BCU (Bengaluru City University)</option>
                    <option value="BNU">BNU (Bengaluru North University)</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    required
                    disabled={!classData.courseName}
                  >
                    <option value="">Select Year</option>
                    {getAvailableYears().map(year => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                  {!classData.courseName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Please select a course first
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classData.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    required
                    disabled={!classData.courseName || !classData.year}
                  >
                    <option value="">Select Semester</option>
                    {getAvailableSemesters().map(semester => (
                      <option key={semester.value} value={semester.value}>
                        {semester.label}
                      </option>
                    ))}
                  </select>
                  {(!classData.courseName || !classData.year) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Please select course and year first
                    </p>
                  )}
                </div>
              </div>
              
              {/* Course Information Display */}
              {classData.courseName && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>{classData.courseName} Course Structure:</strong>
                    {classData.courseName === 'MCA' && ' 2 Years, 4 Semesters'}
                    {classData.courseName === 'BCA' && ' 3 Years, 6 Semesters'}
                  </p>
                </div>
              )}
            </div>

            {/* Subject Teachers */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Subject Teachers Assignment
              </h3>
              
              {/* Add Subject Teacher */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject
                  </label>
                  <select
                    value={newSubjectTeacher.subject}
                    onChange={(e) => setNewSubjectTeacher(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">Select Subject</option>
                    {availableSubjects.filter(subject => 
                      !subjectTeachers.some(st => st.subject === subject)
                    ).map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Teacher Name"
                  type="text"
                  placeholder="Enter teacher name"
                  value={newSubjectTeacher.teacherName}
                  onChange={(e) => setNewSubjectTeacher(prev => ({ ...prev, teacherName: e.target.value }))}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addSubjectTeacher}
                    icon={Plus}
                    className="w-full"
                  >
                    Add Subject Teacher
                  </Button>
                </div>
              </div>

              {/* Subject Teachers List */}
              {subjectTeachers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Assigned Subject Teachers:</h4>
                  <div className="grid gap-3">
                    {subjectTeachers.map((st, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{st.subject}</span>
                          <span className="text-gray-600 dark:text-gray-300 ml-2">- {st.teacherName}</span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeSubjectTeacher(index)}
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

            {/* Teacher Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Class Teacher & Credentials
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <Input
                  label="Class Teacher Name"
                  type="text"
                  value={classData.teacherName}
                  onChange={(e) => handleInputChange('teacherName', e.target.value)}
                  required
                />
                <Input
                  label="Username"
                  type="text"
                  value={classData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="teacher_username"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={classData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/teacher')}
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