import React from 'react';
import { LogOut, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface HeaderProps {
  title: string;
  showLogout?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  backPath?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showLogout = false, 
  showHome = false, 
  showBack = false,
  backPath = '/'
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('teacherAuth');
    toast && toast.success && toast.success('Logged out successfully');
    navigate('/');
  };

  const handleBack = () => {
    navigate(backPath);
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AO</span>
            </div>
            <h1 className="text-xl font-bold text-white">
              {title}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
            )}
            
            {showHome && (
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
                title="Home"
              >
                <Home className="w-5 h-5 text-gray-300" />
              </button>
            )}
            
            {showLogout && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;