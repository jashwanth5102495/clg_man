import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Minimal Landing Component
const MinimalLanding = () => (
  <div style={{ 
    minHeight: '100vh', 
    backgroundColor: '#171717', 
    padding: '20px',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Akash Online Attendance Management System</h1>
    <div style={{ display: 'flex', gap: '20px' }}>
      <Link to="/teacher" style={{
        backgroundColor: '#10B981',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 'bold'
      }}>
        Teacher Portal
      </Link>
      <Link to="/student" style={{
        backgroundColor: '#3B82F6',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 'bold'
      }}>
        Student Portal
      </Link>
      <Link to="/admin" style={{
        backgroundColor: '#DC2626',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 'bold'
      }}>
        Admin Portal
      </Link>
    </div>
  </div>
);

// Minimal Teacher Portal Component
const MinimalTeacherPortal = () => (
  <div style={{ 
    minHeight: '100vh', 
    backgroundColor: '#171717', 
    padding: '20px',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Teacher Portal</h1>
    <div style={{ display: 'flex', gap: '20px' }}>
      <Link to="/" style={{
        backgroundColor: '#3B82F6',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 'bold'
      }}>
        Back to Home
      </Link>
    </div>
  </div>
);

// Minimal App Component
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MinimalLanding />} />
        <Route path="/teacher" element={<MinimalTeacherPortal />} />
        <Route path="*" element={<MinimalLanding />} />
      </Routes>
    </Router>
  );
}

export default App;