import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import { Navigate } from 'react-router-dom';

// Main Pages
import Landing from './pages/Landing';

// Admin Pages
import AdminPortal from './pages/admin/AdminPortal';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateClass from './pages/admin/CreateClass';
import ClassDetails from './pages/admin/ClassDetails';

// Teacher Pages
import TeacherPortal from './pages/teacher/TeacherPortal';
import SubjectTeacherPortal from './pages/teacher/SubjectTeacherPortal';
import SubjectTeacherDashboard from './pages/teacher/SubjectTeacherDashboard';

// Student Pages
import StudentPortal from './pages/student/StudentPortal';
import StudentDashboard from './pages/student/StudentDashboard';

// Faculty Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token || (role && user.role !== role)) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/create-class" element={<CreateClass />} />
          <Route path="/admin/class/:classId" element={<ClassDetails />} />

          {/* Teacher Routes */}
          <Route path="/teacher" element={<TeacherPortal />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/subject" element={<SubjectTeacherPortal />} />
          <Route path="/teacher/subject-dashboard" element={<SubjectTeacherDashboard />} />

          {/* Student Routes */}
          <Route path="/student" element={<StudentPortal />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />

          {/* Faculty Routes */}
          <Route path="/faculty" element={<TeacherPortal />} />
          <Route path="/faculty/dashboard" element={
            <ProtectedRoute role="faculty">
              <TeacherDashboard />
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1F2937',
              color: '#F9FAFB',
              border: '1px solid #10B981',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;