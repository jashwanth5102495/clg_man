import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, School, BookOpen, Eye, Edit, Trash2 } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';
import axios from 'axios';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';

interface ClassData {
  _id: string;
  classId: string;
  classCode: string;
  university: string;
  course: string;
  year: number;
  semester: number;
  teacherName: string;
  classStrength: number;
  boys: number;
  girls: number;
  credentials: {
    username: string;
  };
  subjects: { name: string; teacherName: string }[];
  createdAt: string;
  isActive: boolean;
  workingDays?: number;
  workingDaysLocked?: boolean;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [showCredentials, setShowCredentials] = useState<string | null>(null);
  const [showWorkingDaysModal, setShowWorkingDaysModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [workingDays, setWorkingDays] = useState(100);
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [facultyData, setFacultyData] = useState({
    name: '',
    username: '',
    password: '',
    collegeId: '',
    subjects: ''
  });
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  useEffect(() => {
    // Check admin authentication
    const adminAuth = localStorage.getItem('user');
    if (!adminAuth || JSON.parse(adminAuth).role !== 'admin') {
      navigate('/admin');
      return;
    }

    // Fetch classes from API
    const fetchClasses = async () => {
      try {
        const response = await axios.get('/api/classes');
        setClasses(response.data.classes);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes');
      }
    };

    // Fetch faculty list for dropdown
    const fetchFacultyList = async () => {
      try {
        const response = await axios.get('/api/faculty');
        setFacultyList(response.data.faculty);
      } catch (error) {
        console.error('Error fetching faculty list:', error);
        toast.error('Failed to load faculty list');
      }
    };

    fetchClasses();
    fetchFacultyList();
  }, [navigate]);

  const handleDeleteClass = async (classId: string) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await axios.delete(`/api/classes/${classId}`);
        const updatedClasses = classes.filter(cls => cls._id !== classId);
        setClasses(updatedClasses);
        toast.success('Class deleted successfully');
      } catch (error) {
        console.error('Error deleting class:', error);
        toast.error('Failed to delete class');
      }
    }
  };

  const toggleCredentials = (classId: string) => {
    setShowCredentials(showCredentials === classId ? null : classId);
  };

  const handleWorkingDaysClick = (classData: ClassData) => {
    setSelectedClass(classData);
    setWorkingDays(classData.workingDays || 100);
    setShowWorkingDaysModal(true);
  };

  const handleUpdateWorkingDays = async () => {
    if (!selectedClass) return;

    try {
      const response = await axios.put(`/api/classes/${selectedClass._id}/working-days`, {
        workingDays: workingDays
      });

      // Update local state with the response data
      setClasses(classes.map(cls => 
        cls._id === selectedClass._id 
          ? { 
              ...cls, 
              workingDays: response.data.class.workingDays,
              workingDaysLocked: response.data.class.workingDaysLocked 
            }
          : cls
      ));

      toast.success('Working days updated successfully');
      setShowWorkingDaysModal(false);
      setSelectedClass(null);
    } catch (error: any) {
      console.error('Error updating working days:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update working days';
      toast.error(errorMessage);
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token'); // Use 'token', not 'adminToken'
    try {
      await axios.post(
        'http://localhost:5173/api/faculty/create',
        {
          ...facultyData,
          subjects: facultyData.subjects.split(',').map(s => s.trim())
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      toast.success('Faculty created!');
      setShowAddFaculty(false);
      // Optionally refresh faculty list here
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to create faculty');
      } else {
        toast.error('Failed to create faculty');
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 dark:bg-white">
      <Header title="Admin Dashboard" showLogout showHome />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white dark:text-black tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 dark:text-gray-700">
              Manage classes and teacher credentials
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/create-class')}
            icon={Plus}
            size="lg"
          >
            Create New Class
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 shadow-lg shadow-green-500/10 bg-neutral-800 dark:bg-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4 shadow-md shadow-green-500/20">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{classes.length}</p>
                <p className="text-gray-400">Total Classes</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg shadow-blue-500/10 bg-neutral-800 dark:bg-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4 shadow-md shadow-blue-500/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {classes.reduce((sum, cls) => sum + cls.classStrength, 0)}
                </p>
                <p className="text-gray-400">Total Students</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg shadow-purple-500/10 bg-neutral-800 dark:bg-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4 shadow-md shadow-purple-500/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {new Set(classes.map(cls => cls.course)).size}
                </p>
                <p className="text-gray-400">Courses</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg shadow-orange-500/10 bg-neutral-800 dark:bg-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4 shadow-md shadow-orange-500/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{classes.length}</p>
                <p className="text-gray-400">Teachers</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Classes Table */}
        <Card className="p-6 bg-neutral-800 dark:bg-gray-100">
          <h3 className="text-xl font-bold text-white mb-6">All Classes</h3>
          
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <School className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-400 mb-2">
                No Classes Created
              </h4>
              <p className="text-gray-500 mb-6">
                Create your first class to get started
              </p>
              <Button
                onClick={() => navigate('/admin/create-class')}
                icon={Plus}
              >
                Create First Class
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300">Class Code</th>
                    <th className="text-left py-3 px-4 text-gray-300">Teacher</th>
                    <th className="text-left py-3 px-4 text-gray-300">Course</th>
                    <th className="text-left py-3 px-4 text-gray-300">Students</th>
                    <th className="text-left py-3 px-4 text-gray-300">University</th>
                    <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((classData) => (
                    <React.Fragment key={classData._id}>
                      <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-white dark:text-black">{classData.classCode}</p>
                            <p className="text-sm text-gray-400 dark:text-gray-700">
                              Year {classData.year}, Sem {classData.semester}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-300 dark:text-gray-800">{classData.teacherName}</td>
                        <td className="py-4 px-4 text-gray-300 dark:text-gray-800">{classData.course}</td>
                        <td className="py-4 px-4">
                          <div className="text-gray-300 dark:text-gray-800">
                            <p>{classData.classStrength} total</p>
                            <p className="text-sm text-gray-400 dark:text-gray-700">
                              {classData.boys}M, {classData.girls}F
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-300 dark:text-gray-800">{classData.university}</td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => navigate(`/admin/class/${classData.classId}`)}
                              icon={Eye}
                              variant="secondary"
                              size="sm"
                            >
                              View
                            </Button>
                            <Button
                              onClick={() => toggleCredentials(classData._id)}
                              icon={Eye}
                              variant="secondary"
                              size="sm"
                            >
                              Credentials
                            </Button>
                            <Button
                              onClick={() => handleWorkingDaysClick(classData)}
                              icon={classData.workingDaysLocked ? Eye : Edit}
                              variant="secondary"
                              size="sm"
                            >
                              {classData.workingDaysLocked ? 'View Working Days' : 'Set Working Days'}
                            </Button>
                            <Button
                              onClick={() => handleDeleteClass(classData._id)}
                              icon={Trash2}
                              variant="danger"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {showCredentials === classData._id && (
                        <tr>
                          <td colSpan={6} className="py-4 px-4 bg-gray-800/50">
                            <div className="bg-gray-700 p-4 rounded-lg">
                              <h4 className="font-medium text-white mb-2">Teacher Login Credentials</h4>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-400">Username</p>
                                  <p className="font-mono text-green-400">{classData.credentials.username}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">Password</p>
                                  <p className="font-mono text-green-400">••••••••</p>
                                  <p className="text-xs text-gray-500 mt-1">Password is hashed for security</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Working Days Modal */}
        {showWorkingDaysModal && selectedClass && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <Card className="p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {selectedClass.workingDaysLocked ? 'Working Days Information' : 'Set Working Days'}
                </h3>
                <button
                  onClick={() => setShowWorkingDaysModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-gray-300 mb-4">
                    <strong>Class:</strong> {selectedClass.classCode}
                  </p>
                  <p className="text-gray-300 mb-4">
                    <strong>Teacher:</strong> {selectedClass.teacherName}
                  </p>
                </div>

                {selectedClass.workingDaysLocked ? (
                  // View mode - working days are locked
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-lg font-semibold text-white">Working Days</h4>
                      <span className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded-full">Locked</span>
                    </div>
                    <p className="text-2xl font-bold text-white mb-2">{selectedClass.workingDays}</p>
                    <p className="text-sm text-gray-400">
                      Working days have been set and locked. This value cannot be changed.
                    </p>
                  </div>
                ) : (
                  // Edit mode - working days can be set
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Total Working Days in Academic Year
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="365"
                      value={workingDays}
                      onChange={(e) => setWorkingDays(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter working days (e.g., 200)"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      This will be used to calculate 75% attendance requirement for students
                    </p>
                    <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mt-4">
                      <p className="text-yellow-300 text-sm font-medium">
                        ⚠️ Important: Working days can only be set once and cannot be changed later.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                  <h4 className="text-blue-300 font-medium mb-2">Attendance Policy</h4>
                  <div className="text-sm text-blue-200 space-y-1">
                    <p>• Students need 75% attendance to be safe</p>
                    <p>• Required days: {Math.ceil((selectedClass.workingDays || workingDays) * 0.75)} days</p>
                    <p>• Below 75%: Fine of ₹50 per day shortfall</p>
                    <p>• Students must contact HOD if below 75%</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={() => setShowWorkingDaysModal(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    {selectedClass.workingDaysLocked ? 'Close' : 'Cancel'}
                  </Button>
                  {!selectedClass.workingDaysLocked && (
                    <Button
                      onClick={handleUpdateWorkingDays}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Set Working Days
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Add Faculty Button */}
        <div className="mt-8">
          <Button
            onClick={() => setShowAddFaculty(true)}
            icon={Plus}
            size="lg"
          >
            Add Faculty
          </Button>
        </div>

        {/* Add Faculty Modal */}
        {showAddFaculty && (
          <Modal onClose={() => setShowAddFaculty(false)}>
            <div className="bg-neutral-900 dark:bg-gray-100 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white dark:text-black mb-4">Add New Faculty</h2>
              <form onSubmit={handleAddFaculty} className="space-y-4">
                <div>
                  <Input
                    label="Name"
                    required
                    value={facultyData.name}
                    onChange={(e) => setFacultyData({ ...facultyData, name: e.target.value })}
                    className="bg-gray-800 text-white dark:bg-gray-200 dark:text-black"
                  />
                </div>
                <div>
                  <Input
                    label="Username"
                    required
                    value={facultyData.username}
                    onChange={(e) => setFacultyData({ ...facultyData, username: e.target.value })}
                    className="bg-gray-800 text-white dark:bg-gray-200 dark:text-black"
                  />
                </div>
                <div>
                  <Input
                    label="Password"
                    required
                    type="password"
                    value={facultyData.password}
                    onChange={(e) => setFacultyData({ ...facultyData, password: e.target.value })}
                    className="bg-gray-800 text-white dark:bg-gray-200 dark:text-black"
                  />
                </div>
                <div>
                  <Input
                    label="College ID"
                    required
                    value={facultyData.collegeId}
                    onChange={(e) => setFacultyData({ ...facultyData, collegeId: e.target.value })}
                    className="bg-gray-800 text-white dark:bg-gray-200 dark:text-black"
                  />
                </div>
                <div>
                  <Input
                    label="Subjects (comma separated)"
                    value={facultyData.subjects}
                    onChange={(e) => setFacultyData({ ...facultyData, subjects: e.target.value })}
                    className="bg-gray-800 text-white dark:bg-gray-200 dark:text-black"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Example: Mathematics, Physics, Chemistry
                  </p>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddFaculty(false)}
                    className="bg-gray-700 text-white dark:bg-gray-300 dark:text-black"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    Create Faculty
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;