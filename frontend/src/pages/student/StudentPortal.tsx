import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, School } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import toast from 'react-hot-toast';
import axios from 'axios';

const StudentPortal: React.FC = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    university: 'BCU',
    username: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.username || !loginData.password) {
      toast.error('Please enter valid credentials');
      return;
    }

    try {
      // Call the unified login API
      const response = await axios.post('/api/auth/login', {
        username: loginData.username,
        password: loginData.password,
        university: loginData.university
      });

      // Store authentication data
      localStorage.setItem('studentAuth', JSON.stringify({
        token: response.data.token,
        studentInfo: response.data.studentInfo
      }));
      
      toast.success('Login successful!');
      navigate('/student/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 transition-colors duration-200">
      <Header title="Student Portal" showBack backPath="/" />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <span className="text-2xl">👨‍🎓</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Student Portal
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Access your academic dashboard and view your progress
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-8 shadow-lg shadow-green-500/10 bg-neutral-800">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md shadow-green-500/20">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Student Login
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                University <span className="text-red-500">*</span>
              </label>
              <select
                value={loginData.university}
                onChange={(e) => setLoginData(prev => ({ ...prev, university: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                required
              >
                <option value="BCU">BCU (Bengaluru City University)</option>
                <option value="BNU">BNU (Bengaluru North University)</option>
              </select>
            </div>

            <Input
              label="Username"
              type="text"
              placeholder="Enter your name (lowercase)"
              value={loginData.username}
              onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Your date of birth (DD/MM/YYYY)"
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              required
            />

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Login Info:</strong> Your username is your name in lowercase, 
                and your password is your date of birth in <strong>DD/MM/YYYY</strong> format.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 focus:ring-green-500"
              size="lg"
            >
              Login to Dashboard
            </Button>
          </form>
        </Card>

        {/* Help Section */}
        <Card className="p-6 mt-8 shadow-lg shadow-green-500/10 bg-neutral-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Need Help?
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>• If you forgot your credentials, contact your class teacher</p>
            <p>• Your login details are generated from the student data uploaded by your teacher</p>
            <p>• Make sure to use your full name in lowercase as the username</p>
            <p>• Password format: <strong>DD/MM/YYYY</strong> (e.g., 15/03/2000)</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentPortal;