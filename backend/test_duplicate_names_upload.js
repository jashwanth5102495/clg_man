import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import csv from 'csv-parser';
import Student from './models/Student.js';
import Class from './models/Class.js';

dotenv.config();

async function testDuplicateNamesUpload() {
  try {
    console.log('=== TESTING DUPLICATE NAMES CSV UPLOAD ===');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the test class
    const classDoc = await Class.findOne({ classCode: 'BCU-MCA-1-1' });
    if (!classDoc) {
      console.log('❌ Test class BCU-MCA-1-1 not found');
      return;
    }
    console.log('✅ Found class:', classDoc.classCode);

    // Clear existing students
    await Student.deleteMany({ class: classDoc._id });
    await Class.findOneAndUpdate(
      { classCode: classDoc.classCode },
      { $set: { studentIds: [] } }
    );
    console.log('✅ Cleared existing students');

    // Read and parse CSV
    const students = [];
    const csvPath = './test_duplicate_names.csv';
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          students.push({
            name: row.name?.trim(),
            dob: row.dob?.trim(),
            parentName: row.parentName?.trim(),
            address: row.address?.trim(),
            parentPhone: row.parentPhone?.trim(),
            university: 'BCU',
            course: 'MCA'
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`\n📄 Parsed ${students.length} students from CSV:`);
    students.forEach((s, i) => console.log(`${i + 1}. ${s.name} (DOB: ${s.dob})`));

    // Check for existing students
    const existingStudents = await Student.find({ class: classDoc._id });
    const existingUsernames = existingStudents.map(s => s.credentials.username);
    
    console.log('\n🔄 Processing students with unique ID generation...');
    
    const savedStudents = [];
    const errors = [];

    for (const studentData of students) {
      try {
        // Generate unique student ID
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const studentId = `STU-${timestamp}-${randomSuffix}`;

        // Generate rollNumber
        const count = await Student.countDocuments({ class: classDoc._id });
        const rollNumber = `${classDoc.classCode}-${(count + 1).toString().padStart(4, '0')}`;

        // Generate unique username (handle duplicate names)
        let baseUsername = studentData.name.toLowerCase().replace(/\s+/g, '');
        let username = baseUsername;
        let usernameCounter = 1;
        
        // Check if username already exists and create unique one
        while (existingUsernames.includes(username)) {
          username = `${baseUsername}${usernameCounter}`;
          usernameCounter++;
        }

        const student = new Student({
          studentId,
          name: studentData.name,
          rollNumber,
          dob: studentData.dob,
          parentName: studentData.parentName,
          parentPhone: studentData.parentPhone,
          address: studentData.address,
          university: studentData.university,
          course: studentData.course,
          class: classDoc._id,
          credentials: {
            username,
            password: studentData.dob
          }
        });

        await student.save();
        
        // Update Class document
        await Class.findOneAndUpdate(
          { classCode: classDoc.classCode },
          { $addToSet: { studentIds: student._id } }
        );

        // Add to existing usernames to prevent duplicates within same upload
        existingUsernames.push(username);

        savedStudents.push({
          name: student.name,
          rollNumber: student.rollNumber,
          username: student.credentials.username,
          studentId: student.studentId
        });

        console.log(`✅ Saved: ${student.name} -> Username: ${username}, Roll: ${rollNumber}, ID: ${studentId}`);
        
      } catch (error) {
        console.error(`❌ Error saving ${studentData.name}:`, error.message);
        errors.push(`${studentData.name}: ${error.message}`);
      }
    }

    console.log('\n📊 RESULTS:');
    console.log(`✅ Students saved: ${savedStudents.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    
    if (savedStudents.length > 0) {
      console.log('\n👥 SAVED STUDENTS:');
      savedStudents.forEach((s, i) => {
        console.log(`${i + 1}. ${s.name} | Username: ${s.username} | Roll: ${s.rollNumber} | ID: ${s.studentId}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }

    // Verify final count
    const finalCount = await Student.countDocuments({ class: classDoc._id });
    console.log(`\n🔢 Final student count in database: ${finalCount}`);
    
    console.log('\n🎉 TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

testDuplicateNamesUpload();