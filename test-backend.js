// Simple test script to verify backend connection
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testBackend() {
  console.log('🔍 Testing backend connection...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: Test marks endpoint
    console.log('\n2. Testing marks test endpoint...');
    const marksTestResponse = await axios.get(`${BASE_URL}/api/test-marks`);
    console.log('✅ Marks test passed:', marksTestResponse.data);
    
    console.log('\n🎉 All backend tests passed!');
    
  } catch (error) {
    console.error('❌ Backend test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the test
testBackend();