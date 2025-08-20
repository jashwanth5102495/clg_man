import mongoose from 'mongoose';
import Class from './models/Class.js';
import User from './models/User.js';

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/college_management');
    console.log('Connected to MongoDB');
    
    const classCount = await Class.countDocuments();
    console.log('Total classes in database:', classCount);
    
    if (classCount > 0) {
      const classes = await Class.find({}).limit(3);
      console.log('Sample classes:');
      classes.forEach((c, i) => {
        console.log(`\nClass ${i+1}:`);
        console.log('- ID:', c._id);
        console.log('- ClassCode:', c.classCode);
        console.log('- Teacher field:', c.teacher);
        console.log('- Teachers field:', c.teachers);
        console.log('- University:', c.university);
        console.log('- Course:', c.course);
      });
    } else {
      console.log('No classes found in database');
    }
    
    const userCount = await User.countDocuments({ role: 'teacher' });
    console.log('\nTotal teachers in database:', userCount);
    
    if (userCount > 0) {
      const teachers = await User.find({ role: 'teacher' }).limit(3);
      console.log('Sample teachers:');
      teachers.forEach((t, i) => {
        console.log(`\nTeacher ${i+1}:`);
        console.log('- ID:', t._id);
        console.log('- Name:', t.name);
        console.log('- Username:', t.username);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();