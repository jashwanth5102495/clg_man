import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import toast from 'react-hot-toast';
import axios from 'axios';
import ClassesDebug from '../../components/ClassesDebug';

const TeacherPortal: React.FC = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    selectedClassId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [step, setStep] = useState<'username' | 'class-selection'>('username');
  const [facultyId, setFacultyId] = useState('');

  // Don't load classes on mount - wait for username first

  const loadAvailableClasses = async (facultyId: string) => {
    try {
      setLoadingClasses(true);
      
      console.log('Loading classes for faculty:', facultyId);
      const response = await axios.get(`/api/classes/faculty/${facultyId}`);
      console.log('Available classes response:', response.data);
      
      if (response.data.success && response.data.classes && Array.isArray(response.data.classes)) {
        setAvailableClasses(response.data.classes);
        console.log('Set available classes:', response.data.classes.length, 'classes');
        
        if (response.data.classes.length === 0) {
          toast.error('No classes assigned to you. Please contact admin.');
        }
      } else {
        console.log('No classes found or invalid format');
        setAvailableClasses([]);
        toast.error('No classes found in response');
      }
    } catch (error: any) {
      console.error('Error loading classes:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 404) {
        toast.error('Faculty not found or no classes assigned');
      } else {
        toast.error(`Failed to load classes: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!loginData.username) {
      setError('Please enter your username');
      return;
    }

    try {
      setLoading(true);
      // First, verify the username exists and get faculty ID
      const response = await axios.post('/api/auth/verify-faculty', {
        username: loginData.username
      });
      
      if (response.data.success) {
        setFacultyId(response.data.facultyId);
        setStep('class-selection');
        // Load classes for this faculty
        await loadAvailableClasses(response.data.facultyId);
      }
    } catch (error: any) {
      console.error('Username verification error:', error);
      setError(error.response?.data?.message || 'Username not found');
      toast.error(error.response?.data?.message || 'Username not found');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate all fields
    if (!loginData.selectedClassId) {
      setError('Please select a class');
      setLoading(false);
      return;
    }
    if (!loginData.username) {
      setError('Please enter your username');
      setLoading(false);
      return;
    }
    if (!loginData.password) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/login', {
        username: loginData.username,
        password: loginData.password,
        classId: loginData.selectedClassId
      });

      console.log('Login response:', response.data);

      // Store JWT token and teacher info (user and classInfo)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('teacher', JSON.stringify({
        user: response.data.user,
        classInfo: response.data.classInfo
      }));

      toast.success('Login successful!');
      navigate('/teacher/dashboard');
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900">
      <ClassesDebug />
      <Header title="Teacher Portal" showBack backPath="/" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
            Teacher Portal
          </h1>
          <p className="text-lg text-gray-400">
            Access your class dashboard and manage students
          </p>
        </div>

        {/* Teacher Login */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="p-8 text-center shadow-lg shadow-green-500/10 bg-neutral-800" hover>
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-green-500/20">
              <Users className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">
              Teacher Login
            </h3>
            <p className="text-gray-400 mb-6">
              Enter your credentials to access your class dashboard
            </p>
            
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
            
            {step === 'username' ? (
              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <Input
                  label="Username"
                  type="text"
                  placeholder="Enter your username"
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  required
                  disabled={loading}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-300">
                    <strong>Username:</strong> {loginData.username}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-300 text-left">
                    Select Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={loginData.selectedClassId}
                    onChange={(e) => setLoginData(prev => ({ ...prev, selectedClassId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                    required
                    disabled={loadingClasses || loading}
                  >
                    <option value="">
                      {loadingClasses ? 'Loading classes...' : 'Choose a class'}
                    </option>
                    {availableClasses.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  disabled={loading}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setStep('username');
                      setLoginData(prev => ({ ...prev, selectedClassId: '', password: '' }));
                      setAvailableClasses([]);
                      setError('');
                    }}
                    className="flex-1"
                    size="lg"
                    disabled={loading}
                    variant="outline"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    size="lg"
                    disabled={loading || loadingClasses}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </form>
            )}

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mt-4">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Select your class and use the credentials provided by your admin to login.
              </p>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 bg-neutral-800">
            <h3 className="text-xl font-bold text-white mb-4">Getting Started</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">1</div>
                <div>
                  <p className="font-medium">Select class and login</p>
                  <p className="text-sm text-gray-400">Choose your class and enter credentials provided by admin</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">2</div>
                <div>
                  <p className="font-medium">Access your dashboard</p>
                  <p className="text-sm text-gray-400">View class information, subjects, and student data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">3</div>
                <div>
                  <p className="font-medium">Upload student data</p>
                  <p className="text-sm text-gray-400">Use CSV files to add students to your class</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">4</div>
                <div>
                  <p className="font-medium">Manage attendance and marks</p>
                  <p className="text-sm text-gray-400">Track student progress and performance</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherPortal;