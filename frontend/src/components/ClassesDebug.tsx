import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClassesDebug: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testAPI = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Testing /api/classes endpoint...');
      const response = await axios.get('/api/classes');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Classes array:', response.data.classes);
      
      setClasses(response.data.classes || []);
      
      if (!response.data.classes || response.data.classes.length === 0) {
        setError('No classes found in response');
      }
    } catch (err: any) {
      console.error('API Error:', err);
      console.error('Error response:', err.response?.data);
      setError(`API Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#1f2937', 
      color: 'white', 
      padding: '20px', 
      borderRadius: '8px',
      maxWidth: '400px',
      zIndex: 9999,
      border: '1px solid #374151'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#10b981' }}>Classes API Debug</h3>
      
      <button 
        onClick={testAPI}
        style={{
          background: '#10b981',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>

      {error && (
        <div style={{ color: '#ef4444', marginBottom: '10px', fontSize: '14px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ fontSize: '14px' }}>
        <strong>Classes found:</strong> {classes.length}
      </div>

      {classes.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <strong>Classes:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
            {classes.map((cls, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                {cls.classCode} - {cls.course} {cls.year}-{cls.semester} ({cls.university})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#9ca3af' }}>
        Check browser console for detailed logs
      </div>
    </div>
  );
};

export default ClassesDebug;