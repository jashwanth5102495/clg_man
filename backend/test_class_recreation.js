import mongoose from 'mongoose';
import Student from './models/Student.js';
import Class from './models/Class.js';
import fs from 'fs';
import csv from 'csv-parser';

async function testClassRecreation() {
  try {
    await mongoose.connect('mongodb://localhost:27017/student-management');
    console.log('Connected to MongoDB');
    
    const testClassCode = 'BCU-MCA-1-1';
    
    // Step 1: Clean up any existing data
    console.log('\n=== STEP 1: CLEANUP ===');
    await Student.deleteMany({});
    await Class.deleteMany({});
    console.log('Cleaned up all existing students and classes');
    
    // Step 2: Create a new class
    console.log('\n=== STEP 2: CREATE CLASS ===');
    const newClass = new Class({
      classCode: testClassCode,
      university: 'BCU',
      course: 'MCA',
      year: 1,
      semester: 1,
      classStrength: 50,
      boys: 25,
      girls: 25,
      teachers: [],
      subjects: [],
      studentIds: []
    });
    
    await newClass.save();
    console.log('Created new class:', newClass.classCode, 'ID:', newClass._id);
    
    // Step 3: Simulate CSV upload process
    console.log('\n=== STEP 3: SIMULATE CSV UPLOAD ===');
    
    // Read and parse CSV
    const students = [];
    const csvPath = './test_students.csv';
    
    if (!fs.existsSync(csvPath)) {
      console.log('CSV file not found:', csvPath);
      return;
    }
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          const student = {
            name: row.name?.trim(),
            dob: row.dob?.trim(),
            parentName: row.parentName?.trim(),
            address: row.address?.trim(),
            parentPhone: row['parents number']?.trim(),
            university: newClass.university,
            course: newClass.course
          };
          
          if (student.name && student.dob && student.parentName && student.address) {
            students.push(student);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log('Parsed students from CSV:', students.length);
    
    // Step 4: Process each student (simulate the upload logic)
    console.log('\n=== STEP 4: PROCESS STUDENTS ===');
    
    const savedStudents = [];
    const errors = [];
    
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      
      try {
        console.log(`\nProcessing student ${i + 1}: ${studentData.name}`);
        
        // Generate unique student ID
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const studentId = `STU-${timestamp}-${randomSuffix}`;
        
        // Generate rollNumber
        const count = await Student.countDocuments({ class: newClass._id });
        const rollNumber = `${newClass.classCode}-${(count + 1).toString().padStart(4, '0')}`;
        
        console.log('Generated roll number:', rollNumber);
        
        // Generate username
        const baseUsername = studentData.name.toLowerCase().replace(/\s+/g, '');
        let username = baseUsername;
        let usernameCounter = 1;
        
        // Check for existing usernames
        while (await Student.findOne({ 'credentials.username': username })) {
          username = `${baseUsername}${usernameCounter}`;
          usernameCounter++;
        }
        
        console.log('Generated username:', username);
        
        // Check for duplicate roll number
        const existingStudent = await Student.findOne({ rollNumber });
        if (existingStudent) {
          console.log('ERROR: Duplicate roll number found:', rollNumber);
          errors.push(`Duplicate roll number: ${rollNumber}`);
          continue;
        }
        
        // Create student
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
          class: newClass._id,
          credentials: {
            username,
            password: studentData.dob
          }
        });
        
        console.log('Attempting to save student...');
        await student.save();
        console.log('Student saved successfully!');
        
        // Update class
        await Class.findByIdAndUpdate(newClass._id, {
          $addToSet: { studentIds: student._id }
        });
        
        savedStudents.push(student);
        
      } catch (error) {
        console.error('Error saving student:', studentData.name, error.message);
        if (error.code === 11000) {
          console.log('Duplicate key error details:', error.keyPattern, error.keyValue);
        }
        errors.push(`${studentData.name}: ${error.message}`);
      }
    }
    
    console.log('\n=== RESULTS ===');
    console.log('Students saved:', savedStudents.length);
    console.log('Errors:', errors.length);
    
    if (errors.length > 0) {
      console.log('Error details:');
      errors.forEach(error => console.log('- ' + error));
    }
    
    // Final verification
    const finalCount = await Student.countDocuments();
    console.log('Final student count in database:', finalCount);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

testClassRecreation();