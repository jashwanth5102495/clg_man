import mongoose from 'mongoose';
import User from './models/User.js';
import Class from './models/Class.js';
import Faculty from './models/Faculty.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/college_management');
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({ role: 'faculty' });
    await Class.deleteMany({});
    await Faculty.deleteMany({});
    console.log('Cleared existing data');
    
    // Create sample teachers
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    
    const teachers = [
      {
        name: 'Sunil Kumar',
        username: 'sunil',
        email: 'sunil@college.edu',
        password: hashedPassword,
        role: 'faculty'
      },
      {
        name: 'Priya Sharma',
        username: 'priya',
        email: 'priya@college.edu',
        password: hashedPassword,
        role: 'faculty'
      },
      {
        name: 'Rajesh Gupta',
        username: 'rajesh',
        email: 'rajesh@college.edu',
        password: hashedPassword,
        role: 'faculty'
      }
    ];
    
    const createdTeachers = await User.insertMany(teachers);
    console.log('Created teachers:', createdTeachers.map(t => ({ id: t._id, name: t.name, username: t.username })));
    
    // Create Faculty records
    const facultyRecords = [
      {
        user: createdTeachers[0]._id,
        collegeId: 'FAC001',
        name: 'Sunil Kumar',
        subjects: ['Mathematics', 'Statistics']
      },
      {
        user: createdTeachers[1]._id,
        collegeId: 'FAC002',
        name: 'Priya Sharma',
        subjects: ['Computer Science', 'Programming']
      },
      {
        user: createdTeachers[2]._id,
        collegeId: 'FAC003',
        name: 'Rajesh Gupta',
        subjects: ['Physics', 'Electronics']
      }
    ];
    
    const createdFaculty = await Faculty.insertMany(facultyRecords);
    console.log('Created faculty records:', createdFaculty.length);
    
    // Create sample classes with the new teachers array structure
    const classes = [
      {
        classCode: 'BCU-MCA-1-1',
        university: 'BCU',
        course: 'MCA',
        year: 1,
        semester: 1,
        teachers: [createdTeachers[0]._id], // Using teachers array
        classStrength: 30,
        boys: 18,
        girls: 12,
        subjects: [
          { name: 'Mathematics', teacher: createdTeachers[0]._id },
          { name: 'Computer Science', teacher: createdTeachers[1]._id }
        ],
        classId: '00001',
        isActive: true
      },
      {
        classCode: 'BCU-MCA-1-2',
        university: 'BCU',
        course: 'MCA',
        year: 1,
        semester: 2,
        teachers: [createdTeachers[1]._id], // Using teachers array
        classStrength: 25,
        boys: 15,
        girls: 10,
        subjects: [
          { name: 'Programming', teacher: createdTeachers[1]._id },
          { name: 'Statistics', teacher: createdTeachers[0]._id }
        ],
        classId: '00002',
        isActive: true
      },
      {
        classCode: 'BNU-MCA-1-1',
        university: 'BNU',
        course: 'MCA',
        year: 1,
        semester: 1,
        teachers: [createdTeachers[0]._id, createdTeachers[2]._id], // Multiple teachers
        classStrength: 28,
        boys: 16,
        girls: 12,
        subjects: [
          { name: 'Mathematics', teacher: createdTeachers[0]._id },
          { name: 'Physics', teacher: createdTeachers[2]._id }
        ],
        classId: '00003',
        isActive: true
      }
    ];
    
    const createdClasses = await Class.insertMany(classes);
    console.log('Created classes:', createdClasses.map(c => ({ 
      id: c._id, 
      classCode: c.classCode, 
      teachers: c.teachers.length 
    })));
    
    console.log('\n=== Database seeded successfully! ===');
    console.log('Teachers created:');
    createdTeachers.forEach(t => {
      console.log(`- ${t.name} (username: ${t.username})`);
    });
    
    console.log('\nClasses created:');
    createdClasses.forEach(c => {
      console.log(`- ${c.classCode} (${c.teachers.length} teacher(s))`);
    });
    
    console.log('\nYou can now test the login with:');
    console.log('- Username: sunil, Password: teacher123');
    console.log('- Username: priya, Password: teacher123');
    console.log('- Username: rajesh, Password: teacher123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();