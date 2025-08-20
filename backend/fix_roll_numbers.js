import mongoose from 'mongoose';
import Student from './models/Student.js';
import Class from './models/Class.js';

mongoose.connect('mongodb://localhost:27017/college_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all students
    const allStudents = await Student.find({});
    console.log('Total students found:', allStudents.length);
    
    // Find students with incorrect roll number format (BCA instead of BCU-MCA)
    const incorrectStudents = allStudents.filter(s => 
      s.rollNumber && s.rollNumber.startsWith('BCA')
    );
    
    console.log('\n=== STUDENTS WITH INCORRECT ROLL NUMBERS ===');
    console.log('Count:', incorrectStudents.length);
    
    for (const student of incorrectStudents) {
      console.log('Name:', student.name);
      console.log('Current Roll:', student.rollNumber);
      console.log('Class ID:', student.class);
      
      // Check if class exists
      const classDoc = await Class.findById(student.class);
      if (classDoc) {
        console.log('Class Code:', classDoc.classCode);
      } else {
        console.log('Class: NOT FOUND');
      }
      console.log('---');
    }
    
    // Option 1: Delete incorrect students
    console.log('\n=== CLEANING UP INCORRECT STUDENTS ===');
    if (incorrectStudents.length > 0) {
      const result = await Student.deleteMany({
        rollNumber: { $regex: /^BCA/ }
      });
      console.log('Deleted', result.deletedCount, 'students with incorrect roll numbers');
    }
    
    // Check remaining students
    const remainingStudents = await Student.find({});
    console.log('\n=== REMAINING STUDENTS ===');
    console.log('Total remaining:', remainingStudents.length);
    
    for (const student of remainingStudents) {
      const classDoc = await Class.findById(student.class);
      console.log('Name:', student.name);
      console.log('Roll:', student.rollNumber);
      console.log('Class:', classDoc?.classCode || 'NOT FOUND');
      console.log('---');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });