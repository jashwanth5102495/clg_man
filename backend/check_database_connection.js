import mongoose from 'mongoose';
import Student from './models/Student.js';
import Class from './models/Class.js';

const checkDatabase = async () => {
  try {
    console.log('=== DATABASE CONNECTION CHECK ===');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/college_management');
    console.log('✅ Connected to MongoDB');
    
    // Check connection details
    console.log('Database name:', mongoose.connection.db.databaseName);
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== COLLECTIONS IN DATABASE ===');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check students collection specifically
    console.log('\n=== STUDENTS COLLECTION DETAILS ===');
    const studentsCollection = mongoose.connection.db.collection('students');
    const studentCount = await studentsCollection.countDocuments();
    console.log('Students count:', studentCount);
    
    if (studentCount > 0) {
      const students = await studentsCollection.find({}).toArray();
      console.log('Students found:');
      students.forEach((student, i) => {
        console.log(`${i+1}. ${student.name} - ${student.rollNumber}`);
      });
    }
    
    // Try to insert a test student to see the exact error
    console.log('\n=== TESTING STUDENT INSERTION ===');
    
    // First, let's check if there are any students with the problematic roll number
    const existingStudent = await studentsCollection.findOne({ rollNumber: 'BCU-MCA-1-1-0001' });
    if (existingStudent) {
      console.log('Found existing student with roll number BCU-MCA-1-1-0001:', existingStudent);
    } else {
      console.log('No existing student found with roll number BCU-MCA-1-1-0001');
    }
    
    // Check the class
    const classDoc = await Class.findOne({ classCode: 'BCU-MCA-1-1' });
    if (!classDoc) {
      console.log('❌ Class BCU-MCA-1-1 not found');
      return;
    }
    console.log('✅ Found class:', classDoc.classCode);
    
    // Try to create a test student
    try {
      const testStudent = new Student({
        name: 'Test Student',
        rollNumber: 'BCU-MCA-1-1-0001',
        dob: '01/01/2000',
        parentName: 'Test Parent',
        parentPhone: '1234567890',
        address: 'Test Address',
        university: classDoc.university,
        course: classDoc.course,
        class: classDoc._id,
        credentials: {
          username: 'teststudent',
          password: '01/01/2000'
        }
      });
      
      console.log('Attempting to save test student...');
      await testStudent.save();
      console.log('✅ Test student saved successfully');
      
      // Clean up - delete the test student
      await Student.findByIdAndDelete(testStudent._id);
      console.log('✅ Test student deleted');
      
    } catch (error) {
      console.log('❌ Error saving test student:', error.message);
      if (error.code === 11000) {
        console.log('Duplicate key error details:', {
          code: error.code,
          keyPattern: error.keyPattern,
          keyValue: error.keyValue
        });
        
        // Let's check if there's a document that's not showing up in our queries
        const allDocs = await studentsCollection.find({ rollNumber: 'BCU-MCA-1-1-0001' }).toArray();
        console.log('All documents with this roll number:', allDocs);
      }
    }
    
    console.log('\n=== CHECK COMPLETE ===');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  }
};

checkDatabase();