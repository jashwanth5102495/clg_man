import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import Student from './models/Student.js';
import Class from './models/Class.js';

const simulateCSVUpload = async () => {
  try {
    console.log('=== SIMULATING CSV UPLOAD PROCESS ===');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/college_management');
    console.log('✅ Connected to MongoDB');
    
    // Find the class
    const classCode = 'BCU-MCA-1-1';
    const classDoc = await Class.findOne({ classCode });
    if (!classDoc) {
      console.log('❌ Class not found:', classCode);
      return;
    }
    console.log('✅ Found class:', classDoc.classCode);
    
    // Clear any existing students for clean test
    await Student.deleteMany({ class: classDoc._id });
    console.log('✅ Cleared existing students for clean test');
    
    // Parse CSV file (same logic as in studentRoutes.js)
    const parseCSV = () => {
      return new Promise((resolve, reject) => {
        const students = [];
        const errors = [];

        fs.createReadStream('./test_students.csv')
          .pipe(csv())
          .on('data', (row) => {
            try {
              console.log('Processing row:', row);

              const student = {
                name: row.name?.trim(),
                dob: row.dob?.trim(),
                parentName: row.parentName?.trim() || row['parent_name']?.trim(),
                address: row.address?.trim(),
                parentPhone: row['parents number']?.trim() || row.parentPhone?.trim(),
                rollNumber: row.rollNumber?.trim(),
                university: row.university?.trim() || classDoc.university,
                course: row.course?.trim() || classDoc.course
              };

              console.log('Parsed student data:', student);

              if (!student.name || !student.dob || !student.parentName || !student.address) {
                const error = `Missing required fields for student: ${student.name || 'Unknown'}`;
                console.log('Validation error:', error);
                errors.push(error);
                return;
              }

              // Set defaults for missing fields
              if (!student.university) student.university = classDoc.university;
              if (!student.course) student.course = classDoc.course;

              if (!/^\d{2}\/\d{2}\/\d{4}$/.test(student.dob)) {
                const error = `Invalid DOB format for ${student.name}. Expected DD/MM/YYYY`;
                console.log('DOB validation error:', error);
                errors.push(error);
                return;
              }

              students.push(student);
            } catch (error) {
              console.error('Row parsing error:', error);
              errors.push(`Error parsing row: ${error.message}`);
            }
          })
          .on('end', () => {
            console.log('CSV parsing completed. Students found:', students.length);
            resolve({ students, errors });
          })
          .on('error', (error) => {
            console.error('CSV stream error:', error);
            reject(error);
          });
      });
    };

    const { students, errors } = await parseCSV();
    
    console.log('\n=== PARSING RESULTS ===');
    console.log('Valid students:', students.length);
    console.log('Errors:', errors.length);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => console.log('-', err));
      return;
    }

    if (students.length === 0) {
      console.log('No valid students found in CSV');
      return;
    }

    // Save students to database (same logic as in studentRoutes.js)
    console.log('\n=== SAVING STUDENTS TO DATABASE ===');
    const savedStudents = [];
    const saveErrors = [];

    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      try {
        console.log(`\nSaving student ${i+1}/${students.length}:`, studentData.name);

        // Generate rollNumber if not provided (same logic as in studentRoutes.js)
        let rollNumber = studentData.rollNumber;
        if (!rollNumber) {
          const count = await Student.countDocuments({ class: classDoc._id });
          rollNumber = `${classDoc.classCode}-${(count + 1).toString().padStart(4, '0')}`;
          console.log('Generated roll number:', rollNumber, 'based on count:', count);
        }

        const username = studentData.name.toLowerCase().replace(/\s+/g, '');
        const student = new Student({
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

        console.log('Student data before save:', {
          name: student.name,
          rollNumber: student.rollNumber,
          dob: student.dob,
          university: student.university,
          course: student.course,
          class: student.class,
          username: student.credentials.username
        });

        await student.save();
        console.log('✅ Student saved successfully:', student.name, 'Roll:', student.rollNumber);

        // Update Class document to include student
        await Class.findOneAndUpdate(
          { classCode: classDoc.classCode },
          { $addToSet: { studentIds: student._id } }
        );

        savedStudents.push({
          name: student.name,
          rollNumber: student.rollNumber,
          username: student.credentials.username,
          password: studentData.dob
        });
      } catch (error) {
        console.error('❌ Error saving student:', studentData.name, error.message);
        if (error.code === 11000) {
          console.error('Duplicate key error details:', {
            code: error.code,
            keyPattern: error.keyPattern,
            keyValue: error.keyValue
          });
          saveErrors.push(`Duplicate student: ${studentData.name} (rollNumber or username)`);
        } else {
          saveErrors.push(`Error saving ${studentData.name}: ${error.message}`);
        }
      }
    }

    console.log('\n=== UPLOAD SIMULATION COMPLETE ===');
    console.log('Saved:', savedStudents.length, 'Total processed:', students.length);
    console.log('Errors:', saveErrors.length);
    
    if (saveErrors.length > 0) {
      console.log('\nSave errors:');
      saveErrors.forEach(err => console.log('-', err));
    }
    
    if (savedStudents.length > 0) {
      console.log('\nSaved students:');
      savedStudents.forEach(s => {
        console.log(`- ${s.name} (${s.rollNumber}) - Username: ${s.username}`);
      });
    }
    
    // Final verification
    const finalCount = await Student.countDocuments({ class: classDoc._id });
    console.log('\nFinal student count in database:', finalCount);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  }
};

simulateCSVUpload();