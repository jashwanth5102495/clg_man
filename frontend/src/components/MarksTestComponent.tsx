import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const MarksTestComponent: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/health');
      setTestResult(response.data);
      toast.success('Backend connection successful!');
    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast.error('Backend connection failed!');
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testMarksEndpoint = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/test-marks');
      setTestResult(response.data);
      toast.success('Marks endpoint test successful!');
    } catch (error: any) {
      console.error('Marks endpoint test failed:', error);
      toast.error('Marks endpoint test failed!');
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    try {
      setLoading(true);
      
      // Try multiple token storage locations
      let token = null;
      
      const teacherAuth = localStorage.getItem('teacherAuth');
      if (teacherAuth) {
        try {
          const authData = JSON.parse(teacherAuth);
          token = authData.token;
        } catch (e) {
          console.warn('Failed to parse teacherAuth:', e);
        }
      }
      
      if (!token) {
        token = localStorage.getItem('token');
      }
      
      if (!token) {
        toast.error('No authentication token found');
        setTestResult({ error: 'No token found' });
        return;
      }

      const response = await axios.get('http://localhost:5000/api/classes/my-class', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTestResult(response.data);
      toast.success('Authentication test successful!');
    } catch (error: any) {
      console.error('Auth test failed:', error);
      toast.error('Authentication test failed!');
      setTestResult({ error: error.response?.data || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">Marks Allocation Test</h3>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={testMarksEndpoint}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Marks Endpoint'}
          </button>
          
          <button
            onClick={testAuth}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Authentication'}
          </button>
        </div>
        
        {testResult && (
          <div className="mt-4 p-4 bg-gray-700 rounded">
            <h4 className="text-lg font-semibold text-white mb-2">Test Result:</h4>
            <pre className="text-sm text-gray-300 overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarksTestComponent;