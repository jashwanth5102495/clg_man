import mongoose from 'mongoose';
import Student from './models/Student.js';
import Class from './models/Class.js';

const fixCSVUploadDuplicates = async () => {
  try {
    console.log('=== FIXING CSV UPLOAD DUPLICATE ISSUE ===');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/college_management');
    console.log('✅ Connected to MongoDB');
    
    // Find the class
    const classCode = 'BCU-MCA-1-1';
    const classDoc = await Class.findOne({ classCode });
    if (!classDoc) {
      console.log('❌ Class not found:', classCode);
      return;
    }
    console.log('✅ Found class:', classDoc.classCode);
    
    // Check current students
    const currentStudents = await Student.find({ class: classDoc._id });
    console.log('Current students in class:', currentStudents.length);
    
    if (currentStudents.length > 0) {
      console.log('\nCurrent students:');
      currentStudents.forEach((student, i) => {
        console.log(`${i+1}. ${student.name} - ${student.rollNumber}`);
      });
      
      console.log('\n=== SOLUTION OPTIONS ===');
      console.log('1. Clear existing students to allow fresh CSV upload');
      console.log('2. Keep existing students (user should not re-upload same CSV)');
      console.log('\nChoosing option 1 for testing purposes...');
      
      // Clear existing students for fresh upload
      await Student.deleteMany({ class: classDoc._id });
      console.log('✅ Cleared existing students');
      
      // Update class to remove student references
      await Class.findByIdAndUpdate(classDoc._id, { studentIds: [] });
      console.log('✅ Updated class to remove student references');
      
      // Verify cleanup
      const remainingStudents = await Student.find({ class: classDoc._id });
      console.log('Remaining students after cleanup:', remainingStudents.length);
      
      console.log('\n✅ DATABASE CLEANED - Ready for fresh CSV upload');
      console.log('\n📝 INSTRUCTIONS:');
      console.log('1. Go to the frontend at http://localhost:5173');
      console.log('2. Login as teacher: jashwanth / jashwanth');
      console.log('3. Go to Teacher Dashboard');
      console.log('4. Click "Upload Students CSV"');
      console.log('5. Upload backend/test_students.csv');
      console.log('6. Should now show "5 students added successfully"');
      
    } else {
      console.log('✅ No existing students found - ready for CSV upload');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
};

fixCSVUploadDuplicates();