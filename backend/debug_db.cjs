const mongoose = require('mongoose');
const Class = require('./models/Class');
const Faculty = require('./models/Faculty');

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/college_management');
    console.log('Connected to MongoDB');
    
    console.log('=== CLASSES IN DATABASE ===');
    const classes = await Class.find({}).select('classCode teachers subjects');
    console.log(JSON.stringify(classes, null, 2));
    
    console.log('\n=== FACULTY IN DATABASE ===');
    const faculty = await Faculty.find({}).select('_id name username');
    console.log(JSON.stringify(faculty, null, 2));
    
    console.log('\n=== CHECKING TEACHER ID 68a4bda293831269dc18fb9d ===');
    const teacherId = '68a4bda293831269dc18fb9d';
    const classesForTeacher = await Class.find({ teachers: teacherId });
    console.log('Classes for teacher:', JSON.stringify(classesForTeacher, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();