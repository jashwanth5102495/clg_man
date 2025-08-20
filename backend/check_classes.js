import mongoose from 'mongoose';
import Class from './models/Class.js';
import Student from './models/Student.js';

mongoose.connect('mongodb://localhost:27017/college_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check classes
    const classes = await Class.find({}).select('classCode university course year semester');
    console.log('\n=== CLASSES FOUND ===');
    console.log('Total classes:', classes.length);
    classes.forEach(c => {
      console.log('ClassCode:', c.classCode);
      console.log('University:', c.university);
      console.log('Course:', c.course);
      console.log('Year:', c.year, 'Semester:', c.semester);
      console.log('---');
    });
    
    // Check students with BCU-MCA roll numbers
    const bcuMcaStudents = await Student.find({
      rollNumber: { $regex: /^BCU-MCA/ }
    }).select('name rollNumber class');
    
    console.log('\n=== STUDENTS WITH BCU-MCA ROLL NUMBERS ===');
    console.log('Total BCU-MCA students:', bcuMcaStudents.length);
    bcuMcaStudents.forEach(s => {
      console.log('Name:', s.name);
      console.log('Roll:', s.rollNumber);
      console.log('Class ID:', s.class);
      console.log('---');
    });
    
    // Check all students count by class
    const studentsByClass = await Student.aggregate([
      {
        $group: {
          _id: '$class',
          count: { $sum: 1 },
          rollNumbers: { $push: '$rollNumber' }
        }
      }
    ]);
    
    console.log('\n=== STUDENTS COUNT BY CLASS ===');
    for (const group of studentsByClass) {
      console.log('Class ID:', group._id);
      console.log('Student count:', group.count);
      console.log('Roll numbers:', group.rollNumbers.join(', '));
      console.log('---');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });