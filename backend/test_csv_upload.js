import mongoose from 'mongoose';
import csv from 'csv-parser';
import fs from 'fs';
import Student from './models/Student.js';
import Class from './models/Class.js';

mongoose.connect('mongodb://localhost:27017/college_management')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const classCode = 'BCU-MCA-1-1';
    console.log('Looking for class:', classCode);
    
    const classDoc = await Class.findOne({ classCode: { $regex: `^${classCode}$`, $options: 'i' } });
    if (!classDoc) {
      console.log('Class not found!');
      process.exit(1);
    }
    
    console.log('Found class:', classDoc.classCode, 'ID:', classDoc._id);
    
    // Parse CSV file
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
    }
    
    if (students.length > 0) {
      console.log('\nValid students:');
      students.forEach((s, i) => {
        console.log(`${i+1}. ${s.name} - DOB: ${s.dob} - Parent: ${s.parentName} - Phone: ${s.parentPhone}`);
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });