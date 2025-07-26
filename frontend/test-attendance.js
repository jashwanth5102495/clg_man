// Simple test script to verify attendance functionality
// Run this with: node test-attendance.js

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Test data
const testCredentials = {
  username: 'test-teacher', // Replace with actual teacher username
  password: 'test-password' // Replace with actual teacher password
};

async function testAttendanceSystem() {
  try {
    console.log('🧪 Testing Attendance System...\n');

    // Step 1: Login as teacher
    console.log('1️⃣ Testing Teacher Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/teacher/login`, testCredentials);
    
    if (loginResponse.data.token) {
      console.log('✅ Login successful');
      console.log('📋 Class Info:', loginResponse.data.classInfo);
    } else {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Get class information
    console.log('\n2️⃣ Testing Class Information...');
    const classResponse = await axios.get(`${BASE_URL}/api/classes/my-class`, { headers });
    
    if (classResponse.data.class) {
      console.log('✅ Class data loaded');
      console.log('📚 Subjects:', classResponse.data.class.subjects?.length || 0);
      console.log('🏫 Class Code:', classResponse.data.class.classCode);
    } else {
      console.log('❌ Failed to load class data');
      return;
    }

    const classData = classResponse.data.class;

    // Step 3: Load students
    console.log('\n3️⃣ Testing Student Loading...');
    const studentsResponse = await axios.get(`${BASE_URL}/api/students/by-class/${classData.classId}`, { headers });
    
    if (studentsResponse.data.students) {
      console.log('✅ Students loaded successfully');
      console.log('👥 Student count:', studentsResponse.data.students.length);
      
      if (studentsResponse.data.students.length > 0) {
        console.log('📝 Sample student:', {
          name: studentsResponse.data.students[0].name,
          rollNumber: studentsResponse.data.students[0].rollNumber,
          attendancePercentage: studentsResponse.data.students[0].attendancePercentage
        });
      }
    } else {
      console.log('❌ Failed to load students');
      return;
    }

    const students = studentsResponse.data.students;

    // Step 4: Test attendance recording (if students exist)
    if (students.length > 0 && classData.subjects && classData.subjects.length > 0) {
      console.log('\n4️⃣ Testing Attendance Recording...');
      
      const testSubject = classData.subjects[0].name || classData.subjects[0];
      const testDate = new Date().toISOString().split('T')[0]; // Today's date
      
      // Create test attendance data (mark first student present, second absent if exists)
      const attendanceData = students.slice(0, 2).map((student, index) => ({
        studentId: student._id,
        present: index === 0 // First student present, second absent
      }));

      console.log('📋 Test attendance data:', {
        subject: testSubject,
        date: testDate,
        studentsCount: attendanceData.length
      });

      try {
        const attendanceResponse = await axios.post(`${BASE_URL}/api/attendance/take`, {
          subject: testSubject,
          date: testDate,
          attendanceData
        }, { headers });

        console.log('✅ Attendance recorded successfully');
        console.log('📊 Result:', {
          totalStudents: attendanceResponse.data.totalStudents,
          presentCount: attendanceResponse.data.presentCount,
          absentCount: attendanceResponse.data.absentCount
        });

      } catch (attendanceError) {
        if (attendanceError.response?.status === 400 && 
            attendanceError.response?.data?.message?.includes('already taken')) {
          console.log('⚠️ Attendance already taken for today (this is expected)');
        } else {
          console.log('❌ Attendance recording failed:', attendanceError.response?.data?.message);
        }
      }
    }

    // Step 5: Test marks allocation (if students exist)
    if (students.length > 0 && classData.subjects && classData.subjects.length > 0) {
      console.log('\n5️⃣ Testing Marks Allocation...');
      
      const testStudent = students[0];
      const testSubject = classData.subjects[0].name || classData.subjects[0];
      
      try {
        const marksResponse = await axios.put(`${BASE_URL}/api/students/${testStudent._id}/marks`, {
          type: 'internal',
          marks: [{
            subject: testSubject,
            marks: 85,
            totalMarks: 100,
            date: new Date()
          }]
        }, { headers });

        console.log('✅ Marks allocated successfully');
        console.log('📝 Result:', marksResponse.data);

      } catch (marksError) {
        console.log('❌ Marks allocation failed:', marksError.response?.data?.message);
      }
    }

    console.log('\n🎉 Attendance system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📋 Error details:', error.response.data);
    }
  }
}

// Run the test
testAttendanceSystem();