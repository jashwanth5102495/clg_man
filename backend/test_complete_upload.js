import mongoose from 'mongoose';
import fs from 'fs';
import Student from './models/Student.js';
import Class from './models/Class.js';

// Test the complete CSV upload flow
async function testCSVUpload() {
  try {
    console.log('=== TESTING COMPLETE CSV UPLOAD FLOW ===');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/college_management');
    console.log('✅ Connected to MongoDB');
    
    // Check initial state
    const initialStudents = await Student.find({});
    console.log('📊 Initial students count:', initialStudents.length);
    
    // Check if class exists
    const classCode = 'BCU-MCA-1-1';
    const classDoc = await Class.findOne({ classCode });
    if (!classDoc) {
      console.log('❌ Class not found:', classCode);
      return;
    }
    console.log('✅ Found class:', classDoc.classCode);
    
    // Show CSV file content
    console.log('\n=== CSV FILE CONTENT ===');
    console.log(fs.readFileSync('./test_students.csv', 'utf8'));
    
    // Check students after upload (simulated)
    console.log('\n=== CHECKING EXPECTED RESULTS ===');
    
    // Simulate what should happen after upload
    const expectedStudents = [
      { name: 'jashwanth', rollNumber: 'BCU-MCA-1-1-0001' },
      { name: 'sai', rollNumber: 'BCU-MCA-1-1-0002' },
      { name: 'rohan', rollNumber: 'BCU-MCA-1-1-0003' },
      { name: 'krishna', rollNumber: 'BCU-MCA-1-1-0004' },
      { name: 'anu', rollNumber: 'BCU-MCA-1-1-0005' }
    ];
    
    console.log('Expected students after upload:');
    expectedStudents.forEach((s, i) => {
      console.log(`${i+1}. ${s.name} - ${s.rollNumber}`);
    });
    
    // Check current students
    const currentStudents = await Student.find({}).populate('class');
    console.log('\n=== CURRENT DATABASE STATE ===');
    console.log('Current students count:', currentStudents.length);
    
    if (currentStudents.length > 0) {
      console.log('Current students:');
      currentStudents.forEach((s, i) => {
        console.log(`${i+1}. ${s.name} - ${s.rollNumber} - Class: ${s.class?.classCode || 'No class'}`);
      });
    } else {
      console.log('✅ Database is clean - ready for CSV upload test');
      console.log('\n📝 INSTRUCTIONS FOR MANUAL TEST:');
      console.log('1. Open the frontend at http://localhost:5174');
      console.log('2. Login as teacher with credentials: jashwanth / jashwanth');
      console.log('3. Go to Teacher Dashboard');
      console.log('4. Click "Upload Students CSV"');
      console.log('5. Upload the file: backend/test_students.csv');
      console.log('6. Verify 5 students are added successfully');
      console.log('7. Check that students appear in the table with correct roll numbers');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testCSVUpload();