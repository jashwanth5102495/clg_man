import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import toast from 'react-hot-toast';
import axios from 'axios';

const TeacherPortal: React.FC = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', {
        username: loginData.username,
        password: loginData.password
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
            
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Username"
                type="text"
                placeholder="Enter your username"
                value={loginData.username}
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                required
                disabled={loading}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={loading}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mt-4">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Use the credentials provided by your admin to login.
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
                  <p className="font-medium">Login with your credentials</p>
                  <p className="text-sm text-gray-400">Use the username and password provided by your admin</p>
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