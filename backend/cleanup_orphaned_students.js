import mongoose from 'mongoose';
import Class from './models/Class.js';
import Student from './models/Student.js';

mongoose.connect('mongodb://localhost:27017/college_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all students
    const allStudents = await Student.find({}).populate('class');
    console.log('Total students found:', allStudents.length);
    
    // Find orphaned students (students whose class doesn't exist)
    const orphanedStudents = [];
    const validStudents = [];
    
    for (const student of allStudents) {
      if (!student.class) {
        orphanedStudents.push(student);
      } else {
        validStudents.push(student);
      }
    }
    
    console.log('\n=== ANALYSIS ===');
    console.log('Valid students:', validStudents.length);
    console.log('Orphaned students (no valid class):', orphanedStudents.length);
    
    if (orphanedStudents.length > 0) {
      console.log('\n=== ORPHANED STUDENTS ===');
      orphanedStudents.forEach(s => {
        console.log('Name:', s.name);
        console.log('Roll:', s.rollNumber);
        console.log('Class ID:', s.class);
        console.log('---');
      });
      
      console.log('\nRemoving orphaned students...');
      const result = await Student.deleteMany({
        _id: { $in: orphanedStudents.map(s => s._id) }
      });
      console.log('Removed', result.deletedCount, 'orphaned students');
    }
    
    // Show remaining students
    const remainingStudents = await Student.find({}).populate('class');
    console.log('\n=== REMAINING STUDENTS ===');
    console.log('Total remaining:', remainingStudents.length);
    remainingStudents.forEach(s => {
      console.log('Name:', s.name);
      console.log('Roll:', s.rollNumber);
      console.log('Class:', s.class?.classCode || 'No class');
      console.log('---');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });