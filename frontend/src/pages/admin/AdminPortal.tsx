import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import toast from 'react-hot-toast';
import axios from 'axios';

axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', {
        username: loginData.username,
        password: loginData.password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // ...store user info as needed
      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Invalid admin credentials');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 dark:bg-white">
      <Header title="Admin Portal" showBack backPath="/" />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white dark:text-black mb-4 tracking-tight">
            Admin Portal
          </h1>
          <p className="text-lg text-gray-400 dark:text-gray-700">
            System administration and class management
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-8 shadow-lg shadow-red-500/10 bg-neutral-800 dark:bg-gray-100">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md shadow-red-500/20">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white dark:text-black mb-2">
              Admin Login
            </h2>
            <p className="text-gray-400 dark:text-gray-700">
              Enter your admin credentials to access the system
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Username"
              type="text"
              placeholder="Enter admin username"
              value={loginData.username}
              onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter admin password"
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              required
            />

            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
              <p className="text-sm text-red-300 dark:text-red-700">
                <strong>Demo Credentials:</strong><br />
                Username: admin<br />
                Password: admin123
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500"
              size="lg"
            >
              Login to Admin Dashboard
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminPortal;