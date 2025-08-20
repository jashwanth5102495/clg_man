import mongoose from 'mongoose';
import Student from './models/Student.js';
import Class from './models/Class.js';

async function checkOrphanedStudents() {
  try {
    await mongoose.connect('mongodb://localhost:27017/student-management');
    console.log('Connected to MongoDB');
    
    // Get all students
    const allStudents = await Student.find({});
    console.log(`Total students in database: ${allStudents.length}`);
    
    if (allStudents.length > 0) {
      console.log('\nStudent details:');
      for (const student of allStudents) {
        console.log(`- Name: ${student.name}, Roll: ${student.rollNumber}, Class ID: ${student.class}`);
        
        // Check if the class still exists
        const classExists = await Class.findById(student.class);
        if (!classExists) {
          console.log(`  WARNING: Class ${student.class} does not exist for student ${student.name}`);
        } else {
          console.log(`  Class: ${classExists.classCode}`);
        }
      }
      
      // Check for duplicate roll numbers
      const rollNumbers = allStudents.map(s => s.rollNumber);
      const duplicateRolls = rollNumbers.filter((roll, index) => rollNumbers.indexOf(roll) !== index);
      
      if (duplicateRolls.length > 0) {
        console.log('\nDuplicate roll numbers found:', [...new Set(duplicateRolls)]);
      } else {
        console.log('\nNo duplicate roll numbers found');
      }
      
      // Check for students with roll number BCU-MCA-1-1-0001
      const specificStudent = allStudents.find(s => s.rollNumber === 'BCU-MCA-1-1-0001');
      if (specificStudent) {
        console.log('\nFound student with roll number BCU-MCA-1-1-0001:');
        console.log(`Name: ${specificStudent.name}`);
        console.log(`Class ID: ${specificStudent.class}`);
        
        const classDoc = await Class.findById(specificStudent.class);
        if (classDoc) {
          console.log(`Class Code: ${classDoc.classCode}`);
        } else {
          console.log('Class does not exist - this is an orphaned student!');
        }
      }
    }
    
    // Get all classes
    const allClasses = await Class.find({});
    console.log(`\nTotal classes in database: ${allClasses.length}`);
    
    if (allClasses.length > 0) {
      console.log('\nClass details:');
      for (const classDoc of allClasses) {
        console.log(`- Class Code: ${classDoc.classCode}, ID: ${classDoc._id}`);
        console.log(`  Student IDs: ${classDoc.studentIds ? classDoc.studentIds.length : 0}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

checkOrphanedStudents();