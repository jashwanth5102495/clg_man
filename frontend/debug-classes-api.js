// Debug script to test the classes API endpoint
// Run this to check if your backend is working correctly

const axios = require('axios');

// Configuration - adjust these based on your setup
const BASE_URL = 'http://localhost:5000'; // Change to your backend URL
const API_ENDPOINT = '/api/classes';

async function testClassesAPI() {
  console.log('🔍 Testing Classes API...');
  console.log(`📡 URL: ${BASE_URL}${API_ENDPOINT}`);
  console.log('');

  try {
    // Test the API endpoint
    const response = await axios.get(`${BASE_URL}${API_ENDPOINT}`);
    
    console.log('✅ API Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    
    // Check if classes exist
    if (response.data.classes) {
      console.log(`📚 Classes Found: ${response.data.classes.length}`);
      
      if (response.data.classes.length > 0) {
        console.log('');
        console.log('📋 Class Details:');
        response.data.classes.forEach((cls, index) => {
          console.log(`  ${index + 1}. ${cls.classCode} - ${cls.course} ${cls.year}-${cls.semester} (${cls.university})`);
          console.log(`     Teacher: ${cls.teacherName}`);
          console.log(`     Students: ${cls.classStrength}`);
          console.log('');
        });
      } else {
        console.log('⚠️  No classes found in database');
        console.log('💡 Make sure you have created classes in the admin panel');
      }
    } else {
      console.log('❌ Invalid response format - missing "classes" property');
      console.log('🔧 Expected format: { classes: [...] }');
    }
    
  } catch (error) {
    console.log('❌ API Error:');
    
    if (error.response) {
      // Server responded with error status
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);
      console.log(`   Data:`, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.log('   No response from server');
      console.log('   Check if backend is running on:', BASE_URL);
    } else {
      // Something else happened
      console.log('   Error:', error.message);
    }
  }
}

// Additional checks
async function checkBackendHealth() {
  console.log('🏥 Checking Backend Health...');
  
  try {
    // Try to ping a basic endpoint
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Backend is healthy');
  } catch (error) {
    console.log('⚠️  Backend health check failed');
    console.log('💡 Make sure your backend server is running');
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting API Debug Tests');
  console.log('================================');
  
  await checkBackendHealth();
  console.log('');
  await testClassesAPI();
  
  console.log('');
  console.log('🔧 Troubleshooting Tips:');
  console.log('1. Make sure your backend server is running');
  console.log('2. Check if you have created classes in admin panel');
  console.log('3. Verify the API endpoint URL is correct');
  console.log('4. Check browser network tab for actual requests');
  console.log('5. Look at backend server logs for errors');
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { testClassesAPI, checkBackendHealth };