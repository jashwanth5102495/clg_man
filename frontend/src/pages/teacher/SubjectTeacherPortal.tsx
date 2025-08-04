import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, BookOpen, UserPlus } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import toast from 'react-hot-toast';

const SubjectTeacherPortal: React.FC = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loginData, setLoginData] = useState({
    collegeId: '',
    password: ''
  });
  const [signupData, setSignupData] = useState({
    name: '',
    collegeId: '',
    password: '',
    confirmPassword: '',
    subjects: [] as string[]
  });

  const availableSubjects = [
    'Mathematics', 'Programming', 'Database', 'Networks', 'AI/ML', 'Linux',
    'Data Structures', 'Operating Systems', 'Software Engineering', 'Web Development',
    'Computer Graphics', 'Compiler Design', 'Theory of Computation', 'Digital Electronics'
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if account exists
    const savedAccounts = JSON.parse(localStorage.getItem('subjectTeacherAccounts') || '[]');
    const account = savedAccounts.find((acc: any) => 
      acc.collegeId === loginData.collegeId && acc.password === loginData.password
    );

    if (account) {
      localStorage.setItem('subjectTeacherAuth', JSON.stringify({
        type: 'subject_teacher',
        teacherName: account.name,
        collegeId: account.collegeId,
        subjects: account.subjects
      }));
      toast.success('Subject Teacher login successful!');
      navigate('/teacher/subject-dashboard');
    } else {
      toast.error('Invalid credentials. Please check your College ID and password.');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signupData.subjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }

    // Check if college ID already exists
    const savedAccounts = JSON.parse(localStorage.getItem('subjectTeacherAccounts') || '[]');
    const existingAccount = savedAccounts.find((acc: any) => acc.collegeId === signupData.collegeId);
    
    if (existingAccount) {
      toast.error('College ID already exists');
      return;
    }

    // Create new account
    const newAccount = {
      name: signupData.name,
      collegeId: signupData.collegeId,
      password: signupData.password,
      subjects: signupData.subjects,
      createdAt: new Date().toISOString()
    };

    savedAccounts.push(newAccount);
    localStorage.setItem('subjectTeacherAccounts', JSON.stringify(savedAccounts));
    
    toast.success('Account created successfully! You can now login.');
    setShowSignup(false);
    setShowLogin(true);
    setSignupData({ name: '', collegeId: '', password: '', confirmPassword: '', subjects: [] });
  };

  const handleSubjectToggle = (subject: string) => {
    setSignupData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  return (
    <div className="min-h-screen bg-neutral-900">
      <Header title="Subject Teacher Portal" showBack backPath="/teacher" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Subject Teacher Portal
          </h1>
          <p className="text-lg text-gray-400">
            Take live attendance for your subjects across different classes
          </p>
        </div>

        {!showLogin && !showSignup && (
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="p-8 text-center bg-neutral-800" hover onClick={() => setShowLogin(true)}>
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Login
              </h3>
              <p className="text-gray-400 mb-6">
                Access your subject teacher dashboard
              </p>
              <Button 
                onClick={() => setShowLogin(true)}
                className="w-full"
                size="lg"
              >
                Login to Dashboard
              </Button>
            </Card>

            <Card className="p-8 text-center bg-neutral-800" hover onClick={() => setShowSignup(true)}>
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Create Account
              </h3>
              <p className="text-gray-400 mb-6">
                Register as a new subject teacher
              </p>
              <Button 
                onClick={() => setShowSignup(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                size="lg"
              >
                Create Account
              </Button>
            </Card>
          </div>
        )}

        {/* Login Form */}
        {showLogin && (
          <Card className="p-8 max-w-md mx-auto bg-neutral-800">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Subject Teacher Login
              </h2>
              <p className="text-gray-400">
                Enter your credentials to access your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                label="College ID"
                type="text"
                placeholder="Enter your college ID"
                value={loginData.collegeId}
                onChange={(e) => setLoginData(prev => ({ ...prev, collegeId: e.target.value }))}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                required
              />

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="flex-1"
                >
                  Login
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowLogin(false)}
                  className="flex-1"
                >
                  Back
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false);
                    setShowSignup(true);
                  }}
                  className="text-sm text-green-400 hover:text-green-300 hover:underline transition-colors duration-200"
                >
                  Don't have an account? Create one
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Signup Form */}
        {showSignup && (
          <Card className="p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Create Subject Teacher Account
              </h2>
              <p className="text-gray-400">
                Register to start taking live attendance
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Enter your full name"
                  value={signupData.name}
                  onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />

                <Input
                  label="College ID"
                  type="text"
                  placeholder="Your unique college identifier"
                  value={signupData.collegeId}
                  onChange={(e) => setSignupData(prev => ({ ...prev, collegeId: e.target.value }))}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a password"
                  value={signupData.password}
                  onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-300">
                  Subjects You Teach <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-gray-800 rounded-xl border border-gray-600">
                  {availableSubjects.map(subject => (
                    <label key={subject} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                      <input
                        type="checkbox"
                        checked={signupData.subjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                        className="rounded border-gray-500 text-green-600 focus:ring-green-500 bg-gray-700"
                      />
                      <span className="text-sm text-gray-300">{subject}</span>
                    </label>
                  ))}
                </div>
                
                <p className="text-xs text-green-400 bg-green-900/20 p-3 rounded-lg border border-green-500/30">
                  Selected Subjects: {signupData.subjects.length}
                </p>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                >
                  Create Account
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowSignup(false)}
                  className="flex-1"
                >
                  Back
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowSignup(false);
                    setShowLogin(true);
                  }}
                  className="text-sm text-green-400 hover:text-green-300 hover:underline transition-colors duration-200"
                >
                  Already have an account? Login
                </button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubjectTeacherPortal;