import mongoose from 'mongoose';
import Student from './models/Student.js';
import Class from './models/Class.js';

mongoose.connect('mongodb://localhost:27017/college_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // First, let's check if we have any classes
    const classes = await Class.find({});
    console.log('Classes found:', classes.length);
    
    if (classes.length === 0) {
      console.log('No classes found. Creating a test class first...');
      const testClass = new Class({
        classCode: 'BCU-BCA-2-3',
        className: 'BCA 2nd Year Section 3',
        university: 'BCU'
      });
      await testClass.save();
      console.log('Test class created:', testClass.classCode);
      classes.push(testClass);
    }
    
    // Now create test students
    const testStudents = [
      {
        name: 'John Doe',
        rollNumber: 'BCA001',
        dob: '01/01/2000',
        course: 'BCA',
        parentName: 'Robert Doe',
        address: '123 Main St',
        credentials: {
          username: 'john.doe',
          password: '01/01/2000' // DD/MM/YYYY format as expected by frontend
        },
        class: classes[0]._id,
        university: 'BCU'
      },
      {
        name: 'Jane Smith',
        rollNumber: 'BCA002',
        dob: '15/03/2001',
        course: 'BCA',
        parentName: 'Michael Smith',
        address: '456 Oak Ave',
        credentials: {
          username: 'jane.smith',
          password: '15/03/2001'
        },
        class: classes[0]._id,
        university: 'BCU'
      },
      {
        name: 'Mike Johnson',
        rollNumber: 'BCA003',
        dob: '22/07/1999',
        course: 'BCA',
        parentName: 'David Johnson',
        address: '789 Pine Rd',
        credentials: {
          username: 'mike.johnson',
          password: '22/07/1999'
        },
        class: classes[0]._id,
        university: 'BCU'
      }
    ];
    
    // Clear existing students first
    await Student.deleteMany({});
    console.log('Cleared existing students');
    
    // Insert test students
    const createdStudents = await Student.insertMany(testStudents);
    console.log('Created', createdStudents.length, 'test students');
    
    // Display the created students
    const students = await Student.find({}).populate('class', 'classCode');
    console.log('\n=== Test Students Created ===');
    students.forEach(s => {
      console.log('Name:', s.name);
      console.log('Username:', s.credentials.username);
      console.log('Password:', s.credentials.password);
      console.log('Roll Number:', s.rollNumber);
      console.log('Class:', s.class.classCode);
      console.log('University:', s.university);
      console.log('---');
    });
    
    console.log('\nYou can now login with any of the above credentials!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });