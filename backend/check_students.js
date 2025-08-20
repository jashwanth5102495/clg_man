import mongoose from 'mongoose';
import Student from './models/Student.js';

mongoose.connect('mongodb://localhost:27017/college_management')
  .then(() => {
    console.log('Connected to MongoDB');
    return Student.find({}).select('name credentials rollNumber class parentPhone');
  })
  .then(students => {
    console.log('Students found:', students.length);
    students.forEach(s => {
      console.log('Name:', s.name);
      console.log('Username:', s.credentials?.username);
      console.log('Password:', s.credentials?.password);
      console.log('Roll:', s.rollNumber);
      console.log('Class ID:', s.class);
      console.log('Parent Phone:', s.parentPhone);
      console.log('---');
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });