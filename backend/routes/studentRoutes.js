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
  dest: path.join(__dirname, '../uploads/'),
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
    if (req.user.type !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(req.user.studentId);
    const classDoc = await Class.findOne({ classCode: student.classCode });

    if (!student || !classDoc) {
      return res.status(404).json({ message: 'Student or class not found' });
    }

    // Generate course suggestions
    student.generateSuggestions();
    await student.save();

    // Get attendance status with working days calculation
    const attendanceStatus = await student.getAttendanceStatus();

    // Prepare response data
    const dashboardData = {
      personalInfo: {
        name: student.name,
        dob: student.dob,
        parentName: student.parentName,
        address: student.address,
        university: classDoc.university,
        course: classDoc.course,
        classCode: student.classCode
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
        internal: student.internalMarks,
        semester: student.semesterMarks,
        averageInternal: student.getAverageMarks('internal'),
        averageSemester: student.getAverageMarks('semester')
      },
      suggestions: student.suggestions,
      workingDays: classDoc.workingDays || 100
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get students by class (for teachers)
router.get('/class/:classCode', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { classCode } = req.params;

    if (req.user.classCode !== classCode) {
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    const students = await Student.find({ classCode }).select('-credentials.password');

    const studentsWithStats = students.map(student => ({
      _id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      dob: student.dob,
      parentName: student.parentName,
      address: student.address,
      attendancePercentage: student.getAttendancePercentageSync(),
      attendanceStatus: student.getAttendanceStatusSync(),
      averageInternal: student.getAverageMarks('internal'),
      averageSemester: student.getAverageMarks('semester'),
      isActive: student.isActive
    }));

    res.json(studentsWithStats);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student attendance
router.put('/:studentId/attendance', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { studentId } = req.params;
    const { week, present } = req.body;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if teacher has permission to update this student
    if (req.user.classCode !== student.classCode) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update or add attendance record
    const existingRecord = student.attendance.find(att => att.week === week);

    if (existingRecord) {
      existingRecord.present = present;
      existingRecord.date = new Date();
    } else {
      student.attendance.push({ week, present });
    }

    await student.save();

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

    if (req.user.type !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { studentId } = req.params;
    const { type, marks } = req.body; // type: 'internal' or 'semester'

    const student = await Student.findById(studentId);

    if (!student) {
      console.log('Student not found:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log('Found student:', student.name);

    // Check if teacher has permission to update this student
    if (req.user.classCode !== student.classCode) {
      console.log('Access denied - classCode mismatch');
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update marks - handle both array and single mark formats
    if (type === 'internal') {
      if (Array.isArray(marks)) {
        // New format: array of marks
        student.internalMarks.push(...marks);
      } else {
        // Old format: single mark object
        student.internalMarks.push(marks);
      }
    } else if (type === 'semester') {
      if (Array.isArray(marks)) {
        // New format: array of marks
        student.semesterMarks.push(...marks);
      } else {
        // Old format: single mark object
        student.semesterMarks.push(marks);
      }
    } else {
      return res.status(400).json({ message: 'Invalid marks type' });
    }

    await student.save();
    console.log('Marks updated successfully for:', student.name);

    res.json({ 
      message: 'Marks updated successfully',
      student: student.name,
      type: type,
      marksCount: Array.isArray(marks) ? marks.length : 1
    });
  } catch (error) {
    console.error('Update marks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload students CSV file
router.post('/upload-csv/:classId', verifyToken, upload.single('csvFile'), async (req, res) => {
  try {
    console.log('=== CSV UPLOAD START ===');
    console.log('User type:', req.user?.type);
    console.log('User classCode:', req.user?.classCode);
    console.log('Requested classId:', req.params.classId);

    if (req.user.type !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { classId } = req.params;

    // Find the class using the user's classCode directly (more reliable)
    console.log('Looking for class with classCode:', req.user.classCode);
    const classDoc = await Class.findOne({ classCode: req.user.classCode });
    console.log('Found class:', classDoc ? `${classDoc.classCode} (ID: ${classDoc.classId})` : 'NOT FOUND');

    if (!classDoc) {
      console.log('CLASS NOT FOUND - User classCode:', req.user.classCode);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log('Class found successfully - proceeding with upload');

    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    console.log('Processing CSV file:', req.file.originalname);
    console.log('File path:', req.file.path);
    console.log('Class Code:', classDoc.classCode);

    // Parse CSV file using Promise to handle async properly
    const parseCSV = () => {
      return new Promise((resolve, reject) => {
        const students = [];
        const errors = [];

        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => {
            try {
              console.log('Processing row:', row);

              // Expected CSV columns: name, dob, parentName, address
              const student = {
                name: row.name?.trim(),
                dob: row.dob?.trim(),
                parentName: row.parentName?.trim() || row['parent_name']?.trim(),
                address: row.address?.trim(),
                classCode: classDoc.classCode
              };

              console.log('Parsed student data:', student);

              // Validate required fields
              if (!student.name || !student.dob || !student.parentName || !student.address) {
                const error = `Missing required fields for student: ${student.name || 'Unknown'}`;
                console.log('Validation error:', error);
                errors.push(error);
                return;
              }

              // Validate DOB format (DD/MM/YYYY)
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

    // Parse the CSV file
    const { students, errors } = await parseCSV();

    // Clean up uploaded file
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
      return res.status(400).json({ message: 'No valid students found in CSV' });
    }

    // Save students to database
    const savedStudents = [];
    const saveErrors = [];

    for (const studentData of students) {
      try {
        console.log('Saving student:', studentData.name);

        // Create student with explicit credentials initialization
        const student = new Student({
          ...studentData,
          credentials: {
            username: studentData.name.toLowerCase().replace(/\s+/g, ''),
            password: studentData.dob
          }
        });

        console.log('Student data before save:', {
          name: student.name,
          dob: student.dob,
          classCode: student.classCode,
          username: student.credentials.username,
          password: student.credentials.password
        });

        await student.save();
        console.log('Student saved successfully:', student.name, 'Roll:', student.rollNumber);

        savedStudents.push({
          name: student.name,
          rollNumber: student.rollNumber,
          username: student.credentials.username,
          password: student.credentials.password
        });
      } catch (error) {
        console.error('Error saving student:', studentData.name, error);
        console.error('Full error details:', error);
        if (error.code === 11000) {
          saveErrors.push(`Duplicate student: ${studentData.name}`);
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
    // Clean up uploaded file
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

    if (req.user.type !== 'teacher') {
      console.log('Access denied - user type:', req.user.type);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    const { classId } = req.params;

    // Find the class and verify teacher has access
    console.log('Looking for class with classId:', classId);
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      console.log('Class not found for classId:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log('Found class:', classDoc.classCode);
    console.log('User classCode:', req.user.classCode);

    if (req.user.classCode !== classDoc.classCode) {
      console.log('Access denied - classCode mismatch');
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    const students = await Student.find({ classCode: classDoc.classCode })
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
        username: student.credentials.username,
        password: student.credentials.password // Include for teacher to see login details
      },
      attendancePercentage: await student.getAttendancePercentage(),
      attendanceStatus: await student.getAttendanceStatus(),
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
    if (req.user.type !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { classId } = req.params;
    const { subject, date, attendanceData } = req.body;
    // attendanceData format: [{ studentId, present: true/false }]

    // Find the class and verify teacher has access
    const classDoc = await Class.findOne({ classId });
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (req.user.classCode !== classDoc.classCode) {
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    const results = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        const student = await Student.findById(record.studentId);
        if (!student) {
          errors.push(`Student not found: ${record.studentId}`);
          continue;
        }

        if (student.classCode !== classDoc.classCode) {
          errors.push(`Student ${student.name} not in this class`);
          continue;
        }

        // Add attendance record
        student.attendance.push({
          subject,
          present: record.present,
          date: new Date(date),
          week: Math.ceil(new Date(date).getTime() / (7 * 24 * 60 * 60 * 1000)) // Calculate week number
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

// Upload marks CSV file
router.post('/upload-marks/:classId', verifyToken, upload.single('marksFile'), async (req, res) => {
  try {
    if (req.user.type !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { classId } = req.params;
    const classDoc = await Class.findOne({ classCode: req.user.classCode });

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (!req.file) {
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
                type: row.type?.trim() || 'internal' // internal or semester
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
      return res.status(400).json({ message: 'CSV parsing errors', errors });
    }

    const results = [];
    const saveErrors = [];

    for (const mark of marksData) {
      try {
        const student = await Student.findOne({ 
          rollNumber: mark.rollNumber, 
          classCode: classDoc.classCode 
        });

        if (!student) {
          saveErrors.push(`Student not found: ${mark.rollNumber}`);
          continue;
        }

        if (mark.type === 'internal') {
          student.internalMarks.push({
            subject: mark.subject,
            marks: mark.marks,
            date: new Date()
          });
        } else if (mark.type === 'semester') {
          student.semesterMarks.push({
            subject: mark.subject,
            marks: mark.marks,
            date: new Date()
          });
        }

        await student.save();
        results.push({
          rollNumber: mark.rollNumber,
          name: student.name,
          subject: mark.subject,
          marks: mark.marks,
          type: mark.type
        });

      } catch (error) {
        saveErrors.push(`Error updating ${mark.rollNumber}: ${error.message}`);
      }
    }

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
    if (req.user.type !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { studentId } = req.params;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if teacher has permission to delete this student
    if (req.user.classCode !== student.classCode) {
      return res.status(403).json({ message: 'Access denied to this student' });
    }

    await Student.findByIdAndDelete(studentId);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed student information (for teachers)
router.get('/details/:studentId', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if teacher has permission to view this student
    if (req.user.classCode !== student.classCode) {
      return res.status(403).json({ message: 'Access denied to this student' });
    }

    // Get class info for working days
    const classDoc = await Class.findOne({ classCode: student.classCode });

    // Prepare detailed student data
    const studentDetails = {
      _id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      dob: student.dob,
      parentName: student.parentName,
      address: student.address,
      classCode: student.classCode,
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
      internalMarks: student.internalMarks,
      semesterMarks: student.semesterMarks,
      attendancePercentage: await student.getAttendancePercentage(),
      attendanceStatus: await student.getAttendanceStatus(),
      averageInternal: student.getAverageMarks('internal'),
      averageSemester: student.getAverageMarks('semester'),
      workingDays: classDoc?.workingDays || 100
    };

    res.json({ student: studentDetails });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change student password
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const student = await Student.findById(req.user.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if current password matches
    if (student.credentials.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    student.credentials.password = newPassword;
    await student.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;