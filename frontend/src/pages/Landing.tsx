import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, BarChart3, GraduationCap } from 'lucide-react';
import Header from '../components/Layout/Header';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const roleRef = useRef<HTMLDivElement>(null);

  // Scroll to role section
  const scrollToRole = () => {
    if (roleRef.current) {
      roleRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated SVG background particles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ filter: 'blur(32px)' }}>
        <circle cx="20%" cy="20%" r="120" fill="#67e8f9" fillOpacity="0.18">
          <animate attributeName="cx" values="20%;80%;20%" dur="12s" repeatCount="indefinite" />
        </circle>
        <circle cx="80%" cy="60%" r="100" fill="#4ade80" fillOpacity="0.20">
          <animate attributeName="cy" values="60%;30%;60%" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="50%" cy="90%" r="80" fill="#c084fc" fillOpacity="0.13">
          <animate attributeName="cx" values="50%;10%;50%" dur="14s" repeatCount="indefinite" />
        </circle>
      </svg>
      <Header title="Akash Online Attendance Management System" />
      {/* Hero Section */}
      <section className="relative z-10 text-center py-20">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce-slow">
            <GraduationCap className="w-12 h-12 text-white drop-shadow-lg animate-glow" />
          </div>
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight opacity-0 animate-fade-in [animation-delay:200ms]">Akash Online Attendance Management System</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 opacity-0 animate-fade-in [animation-delay:600ms]">
          Comprehensive solution for managing student data, attendance, and academic performance
        </p>
        <Button onClick={scrollToRole} size="lg" className="bg-green-500 hover:bg-green-600 text-white shadow-lg animate-fade-in [animation-delay:1000ms]">
          Get Started
        </Button>
      </section>
      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-white text-center mb-10">Features</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {/* Feature cards with glassmorphism and 3D tilt/scale on hover */}
          <Card className="p-8 text-center bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 transition-transform duration-300 hover:scale-105 hover:shadow-green-500/30 cursor-pointer">
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-green-500/20">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Class Management</h3>
            <p className="text-gray-300">Create and manage classes with comprehensive student information</p>
          </Card>
          <Card className="p-8 text-center bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 transition-transform duration-300 hover:scale-105 hover:shadow-green-500/30 cursor-pointer">
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-green-500/20">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Excel Integration</h3>
            <p className="text-gray-300">Import student data, attendance, and marks from Excel files</p>
          </Card>
          <Card className="p-8 text-center bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 transition-transform duration-300 hover:scale-105 hover:shadow-green-500/30 cursor-pointer">
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-green-500/20">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Analytics Dashboard</h3>
            <p className="text-gray-300">Visual insights and performance analytics for students</p>
          </Card>
        </div>
      </section>
      {/* Role Selection */}
      <section ref={roleRef} className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-white mb-12">Select Your Role</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {/* Teacher Portal */}
          <Card className="p-10 text-center bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 transition-transform duration-300 hover:scale-105 hover:shadow-green-500/30 cursor-pointer group" hover onClick={() => navigate('/teacher')}>
            <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
              <span className="text-3xl">👩‍🏫</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Teacher Portal</h3>
            <p className="text-gray-300 mb-6">Create classes, upload student data, manage attendance and marks</p>
            <Button onClick={() => navigate('/teacher')} className="w-full" size="lg">Access Teacher Portal</Button>
          </Card>
          {/* Student Portal */}
          <Card className="p-10 text-center bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 transition-transform duration-300 hover:scale-105 hover:shadow-green-500/30 cursor-pointer group" hover>
            <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
              <span className="text-3xl">👨‍🎓</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Student Portal</h3>
            <p className="text-gray-300 mb-6">View your academic progress, attendance, and download reports</p>
            <Button onClick={() => window.open('/student', '_blank')} className="w-full" size="lg">Access Student Portal</Button>
          </Card>
          {/* Admin Portal */}
          <Card className="p-10 text-center bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 transition-transform duration-300 hover:scale-105 hover:shadow-red-500/30 cursor-pointer group" hover onClick={() => navigate('/admin')}>
            <div className="w-20 h-20 bg-gradient-to-tr from-red-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-red-500/20 group-hover:scale-110 transition-transform duration-300">
              <span className="text-3xl">🛡️</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Admin Portal</h3>
            <p className="text-gray-300 mb-6">Manage all classes, teachers, and system administration</p>
            <Button onClick={() => navigate('/admin')} className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500" size="lg">Access Admin Portal</Button>
          </Card>
        </div>
      </section>
      {/* Custom Animations */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2.8s infinite cubic-bezier(.68,-0.55,.27,1.55); }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 0px #fff); }
          50% { filter: drop-shadow(0 0 16px #22d3ee); }
        }
        .animate-glow { animation: glow 2.5s infinite alternate; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1.1s cubic-bezier(.4,0,.2,1) forwards; }
      `}</style>
    </div>
  );
};

export default Landing;