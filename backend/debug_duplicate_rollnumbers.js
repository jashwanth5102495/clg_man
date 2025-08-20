import mongoose from 'mongoose';
import Student from './models/Student.js';
import Class from './models/Class.js';

mongoose.connect('mongodb://localhost:27017/college_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    console.log('\n=== DEBUGGING DUPLICATE ROLL NUMBERS ===');
    
    // Check all students
    const allStudents = await Student.find({});
    console.log('Total students in database:', allStudents.length);
    
    if (allStudents.length > 0) {
      console.log('\nExisting students:');
      allStudents.forEach((student, i) => {
        console.log(`${i+1}. ${student.name} - ${student.rollNumber} - Class: ${student.class}`);
      });
    }
    
    // Check for duplicate roll numbers
    const rollNumbers = allStudents.map(s => s.rollNumber);
    const duplicates = rollNumbers.filter((item, index) => rollNumbers.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  DUPLICATE ROLL NUMBERS FOUND:');
      duplicates.forEach(rollNum => {
        console.log(`- ${rollNum}`);
      });
    } else {
      console.log('\n✅ No duplicate roll numbers found');
    }
    
    // Check database indexes
    console.log('\n=== CHECKING DATABASE INDEXES ===');
    const indexes = await Student.collection.getIndexes();
    console.log('Student collection indexes:', Object.keys(indexes));
    
    // Try to find any documents that might be causing conflicts
    console.log('\n=== CHECKING FOR SPECIFIC ROLL NUMBERS ===');
    const testRollNumbers = [
      'BCU-MCA-1-1-0001',
      'BCU-MCA-1-1-0002', 
      'BCU-MCA-1-1-0003',
      'BCU-MCA-1-1-0004',
      'BCU-MCA-1-1-0005'
    ];
    
    for (const rollNum of testRollNumbers) {
      const existing = await Student.findOne({ rollNumber: rollNum });
      if (existing) {
        console.log(`Found existing student with roll number ${rollNum}:`, {
          name: existing.name,
          rollNumber: existing.rollNumber,
          class: existing.class,
          _id: existing._id
        });
      } else {
        console.log(`No student found with roll number: ${rollNum}`);
      }
    }
    
    // Check classes
    console.log('\n=== CHECKING CLASSES ===');
    const classes = await Class.find({});
    console.log('Classes found:', classes.length);
    
    classes.forEach(cls => {
      console.log(`Class: ${cls.classCode} - Students: ${cls.studentIds?.length || 0}`);
    });
    
    // Clean up any orphaned references
    console.log('\n=== CLEANING UP ORPHANED REFERENCES ===');
    for (const cls of classes) {
      if (cls.studentIds && cls.studentIds.length > 0) {
        const validStudentIds = [];
        for (const studentId of cls.studentIds) {
          const studentExists = await Student.findById(studentId);
          if (studentExists) {
            validStudentIds.push(studentId);
          } else {
            console.log(`Removing orphaned student reference: ${studentId}`);
          }
        }
        
        if (validStudentIds.length !== cls.studentIds.length) {
          await Class.findByIdAndUpdate(cls._id, { studentIds: validStudentIds });
          console.log(`Updated class ${cls.classCode} - removed ${cls.studentIds.length - validStudentIds.length} orphaned references`);
        }
      }
    }
    
    console.log('\n=== DEBUG COMPLETE ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });