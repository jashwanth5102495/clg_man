const mongoose = require('mongoose');
const Class = require('./models/Class');

async function fixTeacherAssignment() {
  try {
    await mongoose.connect('mongodb://localhost:27017/college_management');
    console.log('Connected to MongoDB');
    
    const teacherId = '68a4bda293831269dc18fb9d';
    const classCode = 'BCU-MCA-1-2';
    
    console.log(`Adding teacher ${teacherId} to class ${classCode}`);
    
    // Find the class and add the teacher to the teachers array
    const result = await Class.updateOne(
      { classCode: classCode },
      { $addToSet: { teachers: teacherId } }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const updatedClass = await Class.findOne({ classCode: classCode }).select('classCode teachers');
    console.log('Updated class:', JSON.stringify(updatedClass, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixTeacherAssignment();