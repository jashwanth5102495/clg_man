import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import { verifyToken } from './authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../Uploads/'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get student dashboard data
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    console.log('=== GET STUDENT DASHBOARD START ===');
    console.log('User:', req.user);

    if (req.user.role !== 'student') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a student' });
    }

    const student = await Student.findById(req.user.studentId).populate('class');
    if (!student) {
      console.log('Student not found for ID:', req.user.studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.class) {
      console.log('No class assigned to student:', student._id);
      return res.status(404).json({ message: 'Class not assigned to student' });
    }

    const classDoc = await Class.findById(student.class._id);
    if (!classDoc) {
      console.log('Class document not found for ID:', student.class._id);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log('Found student:', student.name, 'Class:', classDoc.classCode);

    // Generate course suggestions
    // student.generateSuggestions();
    await student.save();

    // Get attendance status with working days calculation
    const attendanceStatus = await student.getAttendanceStatus();

    // Prepare marks data
    const internalMarks = student.marks
      .filter(mark => mark.type === 'internal')
      .map(mark => ({
        subject: mark.subject,
        marks: mark.marks,
        totalMarks: mark.totalMarks,
        date: mark.date,
        isPassed: mark.marks >= (mark.totalMarks * 0.5) // Pass if marks >= 50% of total
      }));

    const semesterMarks = student.marks
      .filter(mark => mark.type === 'semester')
      .map(mark => ({
        subject: mark.subject,
        marks: mark.marks,
        totalMarks: mark.totalMarks,
        date: mark.date,
        isPassed: mark.marks >= (mark.totalMarks * 0.5) // Pass if marks >= 50% of total
      }));

    // Prepare response data
    const dashboardData = {
      personalInfo: {
        name: student.name,
        dob: student.dob,
        parentName: student.parentName,
        address: student.address,
        university: classDoc.university,
        course: classDoc.course,
        classCode: classDoc.classCode
      },
      attendance: {
        percentage: attendanceStatus.percentage,
        status: attendanceStatus.status,
        message: attendanceStatus.message,
        fine: attendanceStatus.fine,
        needsAction: attendanceStatus.needsAction,
        records: student.attendance.map(record => ({
          subject: record.subject,
          date: record.date,
          present: record.present,
          formattedDate: record.date.toLocaleDateString('en-GB')
        }))
      },
      marks: {
        internal: internalMarks,
        semester: semesterMarks,
        averageInternal: student.getAverageMarks('internal'),
        averageSemester: student.getAverageMarks('semester')
      },
      suggestions: student.suggestions || [],
      workingDays: classDoc.workingDays || 100
    };

    console.log('Returning dashboard data for:', student.name);
    res.json(dashboardData);
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get students by class (for teachers)
router.get('/class/:classCode', verifyToken, async (req, res) => {
  try {
    console.log('=== GET STUDENTS BY CLASS START ===');
    console.log('User:', req.user);
    console.log('Requested classCode:', req.params.classCode);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    const { classCode } = req.params;

    console.log('Looking for class with classCode:', classCode);
    const classDoc = await Class.findOne({ classCode: { $regex: `^${classCode}$`, $options: 'i' } });
    if (!classDoc) {
      console.log('Class not found for classCode:', classCode);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log('Found class:', classDoc.classCode);
    console.log('User classCode:', req.user.classCode);

    if (req.user.classCode !== classDoc.classCode) {
      console.log('Access denied - classCode mismatch:', { user: req.user.classCode, class: classDoc.classCode });
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    const students = await Student.find({ class: classDoc._id })
      .select('name rollNumber dob parentName address credentials attendance marks isActive')
      .sort({ name: 1 });

    console.log('Found students:', students.length);
    console.log('Students:', students.map(s => s.name).join(', '));

    const studentsWithStats = await Promise.all(students.map(async student => {
      try {
        return {
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          dob: student.dob,
          parentName: student.parentName,
          address: student.address,
          credentials: {
            username: student.credentials.username
            // Exclude password for security
          },
          attendancePercentage: await student.getAttendancePercentage(),
          attendanceStatus: (await student.getAttendanceStatus()).status,
          averageInternal: student.getAverageMarks('internal'),
          averageSemester: student.getAverageMarks('semester'),
          isActive: student.isActive || true
        };
      } catch (error) {
        console.error(`Error processing stats for student ${student.name}:`, error);
        return {
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          dob: student.dob,
          parentName: student.parentName,
          address: student.address,
          credentials: {
            username: student.credentials.username
          },
          attendancePercentage: 0,
          attendanceStatus: 'Unknown',
          averageInternal: 0,
          averageSemester: 0,
          isActive: student.isActive || true
        };
      }
    }));

    if (!students.length) {
      console.log('No students found for class:', classCode);
      return res.status(404).json({ message: 'No students found for this class' });
    }

    console.log('Returning students:', studentsWithStats.length);
    res.json({ students: studentsWithStats });
  } catch (error) {
    console.error('Get students by class error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update student attendance
router.put('/:studentId/attendance', verifyToken, async (req, res) => {
  try {
    console.log('=== UPDATE STUDENT ATTENDANCE START ===');
    console.log('User:', req.user);
    console.log('StudentId:', req.params.studentId);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    const { studentId } = req.params;
    const { week, present } = req.body;

    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      console.log('Student not found:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.class) {
      console.log('No class assigned to student:', student._id);
      return res.status(404).json({ message: 'Class not assigned to student' });
    }

    if (req.user.classCode !== student.class.classCode) {
      console.log('Access denied - classCode mismatch:', { user: req.user.classCode, student: student.class.classCode });
      return res.status(403).json({ message: 'Access denied to this student' });
    }

    // Update or add attendance record
    const existingRecord = student.attendance.find(att => att.week === week);
    if (existingRecord) {
      existingRecord.present = present;
      existingRecord.date = new Date();
    } else {
      student.attendance.push({ week, present, date: new Date() });
    }

    await student.save();
    console.log('Attendance updated for:', student.name);

    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student marks
router.put('/:studentId/marks', verifyToken, async (req, res) => {
  try {
    console.log('=== UPDATE STUDENT MARKS START ===');
    console.log('User:', req.user);
    console.log('StudentId:', req.params.studentId);
    console.log('Request body:', req.body);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    const { studentId } = req.params;
    const { type, marks } = req.body;

    // Validate input
    if (!type || !marks) {
      return res.status(400).json({ message: 'Type and marks are required' });
    }

    if (!['internal', 'semester'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either "internal" or "semester"' });
    }

    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      console.log('Student not found:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.class) {
      console.log('No class assigned to student:', student._id);
      return res.status(404).json({ message: 'Class not assigned to student' });
    }

    // Check if teacher has access to this class
    const teacherClass = await Class.findOne({ 
      $or: [
        { teacher: req.user.userId },
        { 'subjects.teacher': req.user.userId }
      ],
      _id: student.class._id
    });

    if (!teacherClass) {
      console.log('Access denied - teacher not assigned to this class');
      return res.status(403).json({ message: 'Access denied to this student' });
    }

    const marksArray = Array.isArray(marks) ? marks : [marks];
    
    // Validate marks data
    for (const mark of marksArray) {
      if (!mark.subject || typeof mark.marks !== 'number' || mark.marks < 0) {
        return res.status(400).json({ 
          message: 'Invalid marks data. Subject and valid marks are required.' 
        });
      }
      
      const totalMarks = mark.totalMarks || 100;
      if (mark.marks > totalMarks) {
        return res.status(400).json({ 
          message: `Marks cannot exceed total marks (${totalMarks}) for subject ${mark.subject}` 
        });
      }
    }

    // Add marks to student
    for (const mark of marksArray) {
      student.marks.push({
        subject: mark.subject,
        marks: mark.marks,
        totalMarks: mark.totalMarks || 100,
        type: type,
        date: new Date()
      });
    }

    await student.save();
    console.log('Marks updated successfully for:', student.name);

    res.json({
      message: 'Marks updated successfully',
      student: student.name,
      type: type,
      marksCount: marksArray.length,
      marks: marksArray
    });
  } catch (error) {
    console.error('Update marks error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Upload students CSV file
router.post('/upload-csv/:classId', verifyToken, upload.single('csvFile'), async (req, res) => {
  try {
    console.log('=== CSV UPLOAD START ===');
    console.log('User:', req.user);
    console.log('Requested classId:', req.params.classId);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    const { classId } = req.params;

    console.log('Looking for class with classId:', classId);
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      console.log('Class not found for classId:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log('Found class:', classDoc.classCode);

    if (req.user.classCode !== classDoc.classCode) {
      console.log('Access denied - classCode mismatch:', { user: req.user.classCode, class: classDoc.classCode });
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    if (!req.file) {
      console.log('No CSV file uploaded');
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    console.log('Processing CSV file:', req.file.originalname);
    console.log('File path:', req.file.path);
    console.log('Class Code:', classDoc.classCode);

    // Parse CSV file
    const parseCSV = () => {
      return new Promise((resolve, reject) => {
        const students = [];
        const errors = [];

        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => {
            try {
              console.log('Processing row:', row);

              const student = {
                name: row.name?.trim(),
                dob: row.dob?.trim(),
                parentName: row.parentName?.trim() || row['parent_name']?.trim(),
                address: row.address?.trim(),
                rollNumber: row.rollNumber?.trim(),
                university: row.university?.trim() || classDoc.university,
                course: row.course?.trim() || classDoc.course
              };

              console.log('Parsed student data:', student);

              if (!student.name || !student.dob || !student.parentName || !student.address || !student.university || !student.course) {
                const error = `Missing required fields for student: ${student.name || 'Unknown'}`;
                console.log('Validation error:', error);
                errors.push(error);
                return;
              }

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
    fs.unlinkSync(req.file.path);

    if (errors.length > 0) {
      console.log('CSV parsing errors:', errors);
      return res.status(400).json({
        message: 'CSV parsing errors',
        errors,
        studentsProcessed: students.length
      });
    }

    if (students.length === 0) {
      console.log('No valid students found in CSV');
      return res.status(400).json({ message: 'No valid students found in CSV' });
    }

    // Save students to database
    const savedStudents = [];
    const saveErrors = [];

    for (const studentData of students) {
      try {
        console.log('Saving student:', studentData.name);

        // Generate rollNumber if not provided
        let rollNumber = studentData.rollNumber;
        if (!rollNumber) {
          const count = await Student.countDocuments({ class: classDoc._id });
          rollNumber = `${classDoc.classCode}-${(count + 1).toString().padStart(4, '0')}`;
        }

        const username = studentData.name.toLowerCase().replace(/\s+/g, '');
        const student = new Student({
          name: studentData.name,
          rollNumber,
          dob: studentData.dob,
          parentName: studentData.parentName,
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
        console.log('Student saved successfully:', student.name, 'Roll:', student.rollNumber);

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
        console.error('Error saving student:', studentData.name, error);
        if (error.code === 11000) {
          saveErrors.push(`Duplicate student: ${studentData.name} (rollNumber or username)`);
        } else {
          saveErrors.push(`Error saving ${studentData.name}: ${error.message}`);
        }
      }
    }

    console.log('Upload completed. Saved:', savedStudents.length, 'Total processed:', students.length);

    res.json({
      message: `${savedStudents.length} students added successfully`,
      studentsUploaded: savedStudents.length,
      totalProcessed: students.length,
      students: savedStudents,
      errors: saveErrors
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload CSV error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get students for a specific class (for teacher dashboard)
router.get('/by-class/:classId', verifyToken, async (req, res) => {
  try {
    console.log('=== GET STUDENTS BY CLASS START ===');
    console.log('User:', req.user);
    console.log('Requested classId:', req.params.classId);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    const { classId } = req.params;

    console.log('Looking for class with classId:', classId);
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      console.log('Class not found for classId:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log('Found class:', classDoc.classCode);
    console.log('User classCode:', req.user.classCode);

    if (req.user.classCode !== classDoc.classCode) {
      console.log('Access denied - classCode mismatch:', { user: req.user.classCode, class: classDoc.classCode });
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    const students = await Student.find({ class: classDoc._id })
      .select('-credentials.password')
      .sort({ name: 1 });

    const studentsWithStats = await Promise.all(students.map(async student => ({
      _id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      dob: student.dob,
      parentName: student.parentName,
      address: student.address,
      credentials: {
        username: student.credentials.username
      },
      attendancePercentage: await student.getAttendancePercentage(),
      attendanceStatus: (await student.getAttendanceStatus()).status,
      averageInternal: student.getAverageMarks('internal'),
      averageSemester: student.getAverageMarks('semester'),
      isActive: student.isActive,
      attendance: student.attendance
    })));

    res.json({ students: studentsWithStats });
  } catch (error) {
    console.error('Get students by class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Take attendance for multiple students
router.post('/attendance/:classId', verifyToken, async (req, res) => {
  try {
    console.log('=== TAKE ATTENDANCE START ===');
    console.log('User:', req.user);
    console.log('Requested classId:', req.params.classId);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    const { classId } = req.params;
    const { subject, date, attendanceData } = req.body;

    console.log('Looking for class with classId:', classId);
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      console.log('Class not found for classId:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }

    if (req.user.classCode !== classDoc.classCode) {
      console.log('Access denied - classCode mismatch:', { user: req.user.classCode, class: classDoc.classCode });
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    const results = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        const student = await Student.findById(record.studentId).populate('class');
        if (!student) {
          errors.push(`Student not found: ${record.studentId}`);
          continue;
        }

        if (!student.class || student.class.classCode !== classDoc.classCode) {
          errors.push(`Student ${student.name} not in this class`);
          continue;
        }

        student.attendance.push({
          subject,
          present: record.present,
          date: new Date(date),
          week: Math.ceil(new Date(date).getTime() / (7 * 24 * 60 * 60 * 1000))
        });

        await student.save();
        results.push({
          studentId: student._id,
          name: student.name,
          present: record.present
        });
      } catch (error) {
        errors.push(`Error updating ${record.studentId}: ${error.message}`);
      }
    }

    console.log('Attendance recorded:', results.length, 'students');
    res.json({
      message: 'Attendance recorded successfully',
      subject,
      date,
      studentsUpdated: results.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Take attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk allocate marks to multiple students
router.post('/bulk-marks/:classId', verifyToken, async (req, res) => {
  try {
    console.log('=== BULK MARKS ALLOCATION START ===');
    console.log('User:', req.user);
    console.log('ClassId:', req.params.classId);
    console.log('Request body:', req.body);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    const { classId } = req.params;
    const { subject, type, maxMarks, studentsMarks } = req.body;

    // Validate input
    if (!subject || !type || !studentsMarks || !Array.isArray(studentsMarks)) {
      return res.status(400).json({ 
        message: 'Subject, type, and studentsMarks array are required' 
      });
    }

    if (!['internal', 'semester'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either "internal" or "semester"' });
    }

    const totalMarks = maxMarks || 100;

    // Find the class
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      console.log('Class not found for classId:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if teacher has access to this class
    const teacherClass = await Class.findOne({ 
      $or: [
        { teacher: req.user.userId },
        { 'subjects.teacher': req.user.userId }
      ],
      _id: classDoc._id
    });

    if (!teacherClass) {
      console.log('Access denied - teacher not assigned to this class');
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    const results = [];
    const errors = [];

    // Process each student's marks
    for (const studentMark of studentsMarks) {
      try {
        const { studentId, marks } = studentMark;
        
        if (!studentId || typeof marks !== 'number' || marks < 0 || marks > totalMarks) {
          errors.push(`Invalid marks data for student ${studentId}`);
          continue;
        }

        const student = await Student.findById(studentId).populate('class');
        if (!student) {
          errors.push(`Student not found: ${studentId}`);
          continue;
        }

        if (!student.class || student.class._id.toString() !== classDoc._id.toString()) {
          errors.push(`Student ${student.name} not in this class`);
          continue;
        }

        // Add marks to student
        student.marks.push({
          subject: subject,
          marks: marks,
          totalMarks: totalMarks,
          type: type,
          date: new Date()
        });

        await student.save();
        
        results.push({
          studentId: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          subject: subject,
          marks: marks,
          totalMarks: totalMarks,
          type: type
        });

        console.log(`Marks allocated to ${student.name}: ${marks}/${totalMarks}`);
      } catch (error) {
        console.error(`Error processing student ${studentMark.studentId}:`, error);
        errors.push(`Error updating student ${studentMark.studentId}: ${error.message}`);
      }
    }

    console.log(`Bulk marks allocation completed. Success: ${results.length}, Errors: ${errors.length}`);

    res.json({
      message: `Marks allocated successfully to ${results.length} students`,
      subject: subject,
      type: type,
      totalMarks: totalMarks,
      studentsUpdated: results.length,
      totalProcessed: studentsMarks.length,
      results: results,
      errors: errors
    });
  } catch (error) {
    console.error('Bulk marks allocation error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Upload marks CSV file
router.post('/upload-marks/:classId', verifyToken, upload.single('marksFile'), async (req, res) => {
  try {
    console.log('=== UPLOAD MARKS START ===');
    console.log('User:', req.user);
    console.log('Requested classId:', req.params.classId);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    const { classId } = req.params;
    console.log('Looking for class with classId:', classId);
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      console.log('Class not found for classId:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }

    if (req.user.classCode !== classDoc.classCode) {
      console.log('Access denied - classCode mismatch:', { user: req.user.classCode, class: classDoc.classCode });
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    if (!req.file) {
      console.log('No CSV file uploaded');
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const parseCSV = () => {
      return new Promise((resolve, reject) => {
        const marksData = [];
        const errors = [];

        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => {
            try {
              const marks = {
                rollNumber: row.rollNumber?.trim(),
                subject: row.subject?.trim(),
                marks: parseFloat(row.marks),
                totalMarks: parseFloat(row.totalMarks) || 100, // Default to 100
                type: row.type?.trim() || 'internal'
              };

              if (!marks.rollNumber || !marks.subject || isNaN(marks.marks)) {
                errors.push(`Invalid data for roll number: ${marks.rollNumber}`);
                return;
              }

              marksData.push(marks);
            } catch (error) {
              errors.push(`Error parsing row: ${error.message}`);
            }
          })
          .on('end', () => resolve({ marksData, errors }))
          .on('error', reject);
      });
    };

    const { marksData, errors } = await parseCSV();
    fs.unlinkSync(req.file.path);

    if (errors.length > 0) {
      console.log('CSV parsing errors:', errors);
      return res.status(400).json({ message: 'CSV parsing errors', errors });
    }

    const results = [];
    const saveErrors = [];

    for (const mark of marksData) {
      try {
        const student = await Student.findOne({
          rollNumber: mark.rollNumber,
          class: classDoc._id
        }).populate('class');

        if (!student) {
          saveErrors.push(`Student not found: ${mark.rollNumber}`);
          continue;
        }

        if (!student.class || student.class.classCode !== classDoc.classCode) {
          saveErrors.push(`Student ${mark.rollNumber} not in this class`);
          continue;
        }

        student.marks.push({
          subject: mark.subject,
          marks: mark.marks,
          totalMarks: mark.totalMarks,
          type: mark.type,
          date: new Date()
        });

        await student.save();
        results.push({
          rollNumber: mark.rollNumber,
          name: student.name,
          subject: mark.subject,
          marks: mark.marks,
          totalMarks: mark.totalMarks,
          type: mark.type
        });
      } catch (error) {
        saveErrors.push(`Error updating ${mark.rollNumber}: ${error.message}`);
      }
    }

    console.log('Marks upload completed:', results.length, 'marks');
    res.json({
      message: `${results.length} marks uploaded successfully`,
      marksUploaded: results.length,
      totalProcessed: marksData.length,
      results,
      errors: saveErrors
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload marks error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Delete student
router.delete('/:studentId', verifyToken, async (req, res) => {
  try {
    console.log('=== DELETE STUDENT START ===');
    console.log('User:', req.user);
    console.log('StudentId:', req.params.studentId);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    const { studentId } = req.params;
    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      console.log('Student not found:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.class) {
      console.log('No class assigned to student:', student._id);
      return res.status(404).json({ message: 'Class not assigned to student' });
    }

    if (req.user.classCode !== student.class.classCode) {
      console.log('Access denied - classCode mismatch:', { user: req.user.classCode, student: student.class.classCode });
      return res.status(403).json({ message: 'Access denied to this student' });
    }

    await Student.findByIdAndDelete(studentId);
    await Class.findOneAndUpdate(
      { classCode: student.class.classCode },
      { $pull: { studentIds: studentId } }
    );

    console.log('Student deleted:', student.name);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student marks
router.get('/:studentId/marks', verifyToken, async (req, res) => {
  try {
    console.log('=== GET STUDENT MARKS START ===');
    console.log('User:', req.user);
    console.log('StudentId:', req.params.studentId);

    if (req.user.role !== 'faculty' && req.user.role !== 'student') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied' });
    }

    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      console.log('Student not found:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.class) {
      console.log('No class assigned to student:', student._id);
      return res.status(404).json({ message: 'Class not assigned to student' });
    }

    // Check access permissions
    if (req.user.role === 'faculty') {
      const teacherClass = await Class.findOne({ 
        $or: [
          { teacher: req.user.userId },
          { 'subjects.teacher': req.user.userId }
        ],
        _id: student.class._id
      });

      if (!teacherClass) {
        console.log('Access denied - teacher not assigned to this class');
        return res.status(403).json({ message: 'Access denied to this student' });
      }
    } else if (req.user.role === 'student') {
      if (req.user.studentId !== studentId) {
        console.log('Access denied - student can only view own marks');
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Group marks by type and subject
    const internalMarks = student.marks.filter(mark => mark.type === 'internal');
    const semesterMarks = student.marks.filter(mark => mark.type === 'semester');

    const marksData = {
      student: {
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        class: student.class.classCode
      },
      marks: {
        internal: internalMarks.map(mark => ({
          subject: mark.subject,
          marks: mark.marks,
          totalMarks: mark.totalMarks,
          percentage: ((mark.marks / mark.totalMarks) * 100).toFixed(2),
          date: mark.date,
          isPassed: mark.marks >= (mark.totalMarks * 0.5)
        })),
        semester: semesterMarks.map(mark => ({
          subject: mark.subject,
          marks: mark.marks,
          totalMarks: mark.totalMarks,
          percentage: ((mark.marks / mark.totalMarks) * 100).toFixed(2),
          date: mark.date,
          isPassed: mark.marks >= (mark.totalMarks * 0.5)
        })),
        averageInternal: student.getAverageMarks('internal'),
        averageSemester: student.getAverageMarks('semester'),
        totalMarks: student.marks.length
      }
    };

    console.log('Returning marks data for:', student.name);
    res.json(marksData);
  } catch (error) {
    console.error('Get student marks error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get detailed student information (for teachers)
router.get('/details/:studentId', verifyToken, async (req, res) => {
  try {
    console.log('=== GET STUDENT DETAILS START ===');
    console.log('User:', req.user);
    console.log('StudentId:', req.params.studentId);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      console.log('Student not found:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.class) {
      console.log('No class assigned to student:', student._id);
      return res.status(404).json({ message: 'Class not assigned to student' });
    }

    if (req.user.classCode !== student.class.classCode) {
      console.log('Access denied - classCode mismatch:', { user: req.user.classCode, student: student.class.classCode });
      return res.status(403).json({ message: 'Access denied to this student' });
    }

    const classDoc = await Class.findById(student.class._id);
    if (!classDoc) {
      console.log('Class not found for ID:', student.class._id);
      return res.status(404).json({ message: 'Class not found' });
    }

    const studentDetails = {
      _id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      dob: student.dob,
      parentName: student.parentName,
      address: student.address,
      classCode: classDoc.classCode,
      credentials: {
        username: student.credentials.username,
        password: student.credentials.password
      },
      attendance: student.attendance.map(record => ({
        subject: record.subject,
        date: record.date,
        present: record.present,
        formattedDate: record.date.toLocaleDateString('en-GB')
      })),
      internalMarks: student.marks.filter(mark => mark.type === 'internal').map(mark => ({
        subject: mark.subject,
        marks: mark.marks,
        totalMarks: mark.totalMarks,
        date: mark.date,
        isPassed: mark.marks >= (mark.totalMarks * 0.5)
      })),
      semesterMarks: student.marks.filter(mark => mark.type === 'semester').map(mark => ({
        subject: mark.subject,
        marks: mark.marks,
        totalMarks: mark.totalMarks,
        date: mark.date,
        isPassed: mark.marks >= (mark.totalMarks * 0.5)
      })),
      attendancePercentage: await student.getAttendancePercentage(),
      attendanceStatus: await student.getAttendanceStatus(),
      averageInternal: student.getAverageMarks('internal'),
      averageSemester: student.getAverageMarks('semester'),
      workingDays: classDoc.workingDays || 100
    };

    console.log('Returning details for:', student.name);
    res.json({ student: studentDetails });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change student password
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    console.log('=== CHANGE STUDENT PASSWORD START ===');
    console.log('User:', req.user);

    if (req.user.role !== 'student') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied - not a student' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      console.log('Missing password fields');
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const student = await Student.findById(req.user.studentId);
    if (!student) {
      console.log('Student not found:', req.user.studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.credentials.password !== currentPassword) {
      console.log('Incorrect current password');
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    student.credentials.password = newPassword; // Hash in production
    await student.save();

    console.log('Password changed for:', student.name);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;