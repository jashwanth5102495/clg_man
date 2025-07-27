import express from 'express';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import { verifyToken } from './authRoutes.js';
import mongoose from 'mongoose';

const router = express.Router();

// Take attendance for a subject
router.post('/take', verifyToken, async (req, res) => {
  try {
    console.log('=== TAKE ATTENDANCE START ===');
    console.log('User:', req.user);
    console.log('Request body:', req.body);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ error: 'Access denied - not a teacher' });
    }

    if (!req.user.classCode) {
      console.log('No classCode in user token');
      return res.status(400).json({ error: 'Invalid user token - missing classCode' });
    }

    const { subject, date, attendanceData, classCode } = req.body;

    if (!subject || !date || !attendanceData || !Array.isArray(attendanceData) || !classCode) {
      console.log('Missing fields:', { subject, date, attendanceData, classCode });
      return res.status(400).json({ error: 'Missing required fields: subject, date, attendanceData, classCode' });
    }

    if (classCode !== req.user.classCode) {
      console.log('Class code mismatch:', { request: classCode, user: req.user.classCode });
      return res.status(403).json({ error: 'Access denied - invalid classCode' });
    }

    console.log(`Taking attendance for subject: ${subject}, date: ${date}, students: ${attendanceData.length}`);

    // Get teacher's class
    const classDoc = await Class.findOne({ classCode });
    if (!classDoc) {
      console.log('Class not found for classCode:', classCode);
      return res.status(404).json({ error: 'Class not found' });
    }

    console.log('Found class:', classDoc.classCode);

    // Check if attendance already exists
    const attendanceDate = new Date(date);
    const existingAttendance = await Attendance.findOne({
      classCode,
      subject,
      date: {
        $gte: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate()),
        $lt: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate() + 1)
      }
    });

    if (existingAttendance) {
      console.log('Attendance already exists for this date and subject');
      return res.status(400).json({ error: 'Attendance already taken for this subject on this date' });
    }

    // Prepare attendance record
    const students = [];
    const studentUpdates = [];
    let processedCount = 0;

    for (const record of attendanceData) {
      try {
        if (!mongoose.Types.ObjectId.isValid(record.studentId)) {
          console.log(`Invalid student ID: ${record.studentId}`);
          continue;
        }

        const student = await Student.findById(record.studentId).populate('class');
        if (!student) {
          console.log(`Student not found: ${record.studentId}`);
          continue;
        }

        if (!student.class || student.class.classCode !== classDoc.classCode) {
          console.log(`Student ${student.name} not in correct class. Student classCode: ${student.class ? student.class.classCode : 'undefined'}, Expected: ${classDoc.classCode}`);
          continue;
        }

        students.push({
          student: student._id,
          rollNumber: student.rollNumber,
          name: student.name,
          present: record.present
        });

        // Add attendance record to student
        student.attendance.push({
          subject,
          date: attendanceDate,
          present: record.present,
          attendanceId: null
        });

        studentUpdates.push(student.save());
        processedCount++;

        console.log(`Processed student: ${student.name} - ${record.present ? 'Present' : 'Absent'}`);
      } catch (studentError) {
        console.error(`Error processing student ${record.studentId}:`, studentError);
      }
    }

    console.log(students.length, 'students processed for attendance');
    console.log('Attendance data:', students);

    if (students.length === 0) {
      console.log('No valid students processed. Attendance data:', attendanceData);
      return res.status(400).json({ error: 'No valid students found to record attendance' });
    }

    // Create attendance record
    const presentCount = students.filter(s => s.present).length;
    const attendance = new Attendance({
      classCode: classDoc.classCode,
      subject,
      date: attendanceDate,
      teacher: req.user.userId,
      students,
      totalStudents: students.length,
      presentCount,
      absentCount: students.length - presentCount
    });

    console.log(`Saving attendance record with ${students.length} students`);

    // Save attendance and update students
    await Promise.all([attendance.save(), ...studentUpdates]);

    // Update attendance ID in student records
    for (const studentRecord of students) {
      try {
        const studentDoc = await Student.findById(studentRecord.student);
        if (studentDoc) {
          const attendanceRecord = studentDoc.attendance.find(
            att => att.subject === subject &&
                   att.date.toDateString() === attendanceDate.toDateString() &&
                   att.present === studentRecord.present
          );
          if (attendanceRecord) {
            attendanceRecord.attendanceId = attendance._id;
            await studentDoc.save();
          }
        }
      } catch (updateError) {
        console.error(`Error updating attendance ID for student ${studentRecord.student}:`, updateError);
      }
    }

    console.log(`Attendance recorded successfully: ${presentCount}/${students.length} present`);

    res.json({
      message: 'Attendance recorded successfully',
      attendanceId: attendance._id,
      subject,
      date: attendanceDate,
      totalStudents: students.length,
      presentCount,
      absentCount: students.length - presentCount,
      processedStudents: processedCount
    });

  } catch (error) {
    console.error('Take attendance error:', error);
    res.status(500).json({
      error: `Server error while recording attendance: ${process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'}`
    });
  }
});

// Get attendance records for a class
router.get('/class/:classCode', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') { // Changed from type to role
      console.log('Access denied - role:', req.user.role); // Updated log
      return res.status(403).json({ error: 'Access denied - not a teacher' }); // Changed to error
    }

    const { classCode } = req.params;

    if (req.user.classCode !== classCode) {
      console.log('Class code mismatch:', { request: classCode, user: req.user.classCode });
      return res.status(403).json({ error: 'Access denied to this class' }); // Changed to error
    }

    const attendanceRecords = await Attendance.find({ classCode })
      .sort({ date: -1, subject: 1 });

    res.json({ attendanceRecords });

  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({ error: 'Server error' }); // Changed to error
  }
});

// Get attendance for a specific date and subject
router.get('/details/:attendanceId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') { // Changed from type to role
      console.log('Access denied - role:', req.user.role); // Updated log
      return res.status(403).json({ error: 'Access denied - not a teacher' }); // Changed to error
    }

    const { attendanceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(attendanceId)) { // Added ID validation
      console.log(`Invalid attendance ID: ${attendanceId}`);
      return res.status(400).json({ error: 'Invalid attendance ID' });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' }); // Changed to error
    }

    if (req.user.classCode !== attendance.classCode) {
      console.log('Class code mismatch:', { attendance: attendance.classCode, user: req.user.classCode });
      return res.status(403).json({ error: 'Access denied to this attendance record' }); // Changed to error
    }

    res.json({ attendance });

  } catch (error) {
    console.error('Get attendance details error:', error);
    res.status(500).json({ error: 'Server error' }); // Changed to error
  }
});

// Update attendance record
router.put('/update/:attendanceId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') { // Changed from type to role
      console.log('Access denied - role:', req.user.role); // Updated log
      return res.status(403).json({ error: 'Access denied - not a teacher' }); // Changed to error
    }

    const { attendanceId } = req.params;
    const { attendanceData } = req.body;

    if (!attendanceData || !Array.isArray(attendanceData)) { // Added validation
      console.log('Missing attendanceData or not an array');
      return res.status(400).json({ error: 'Missing or invalid attendanceData' }); // Changed to error
    }

    if (!mongoose.Types.ObjectId.isValid(attendanceId)) { // Added ID validation
      console.log(`Invalid attendance ID: ${attendanceId}`);
      return res.status(400).json({ error: 'Invalid attendance ID' });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' }); // Changed to error
    }

    if (req.user.classCode !== attendance.classCode) {
      console.log('Class code mismatch:', { attendance: attendance.classCode, user: req.user.classCode });
      return res.status(403).json({ error: 'Access denied to this attendance record' }); // Changed to error
    }

    // Update attendance record
    attendance.students = attendanceData.map(record => ({
      student: record.studentId, // Changed from studentId to student
      rollNumber: record.rollNumber,
      name: record.name,
      present: record.present
    }));
    attendance.totalStudents = attendanceData.length; // Added required field
    attendance.presentCount = attendanceData.filter(r => r.present).length; // Added required field
    attendance.absentCount = attendanceData.length - attendance.presentCount; // Added required field

    await attendance.save();

    // Update student records
    const studentUpdates = [];
    for (const record of attendanceData) {
      if (!mongoose.Types.ObjectId.isValid(record.studentId)) { // Added ID validation
        console.log(`Invalid student ID in update: ${record.studentId}`);
        continue;
      }
      const student = await Student.findById(record.studentId);
      if (student) {
        const attendanceRecord = student.attendance.find(
          att => att.attendanceId && att.attendanceId.toString() === attendanceId
        );
        if (attendanceRecord) {
          attendanceRecord.present = record.present;
          studentUpdates.push(student.save());
        }
      }
    }

    await Promise.all(studentUpdates);

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Server error' }); // Changed to error
  }
});

// Get student's attendance summary
router.get('/student/summary', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') { // Changed from type to role
      console.log('Access denied - role:', req.user.role); // Updated log
      return res.status(403).json({ error: 'Access denied - not a student' }); // Changed to error
    }

    const student = await Student.findById(req.user.userId); // Changed from studentId to userId
    if (!student) {
      return res.status(404).json({ error: 'Student not found' }); // Changed to error
    }

    // Get class info for working days
    const classDoc = await Class.findOne({ classCode: student.classCode });
    const workingDays = classDoc?.workingDays || 100;

    // Group attendance by subject
    const subjectAttendance = {};
    const absentDates = [];

    student.attendance.forEach(record => {
      if (!subjectAttendance[record.subject]) {
        subjectAttendance[record.subject] = {
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0
        };
      }

      subjectAttendance[record.subject].total++;
      if (record.present) {
        subjectAttendance[record.subject].present++;
      } else {
        subjectAttendance[record.subject].absent++;
        absentDates.push({
          subject: record.subject,
          date: record.date,
          formattedDate: record.date.toLocaleDateString('en-GB')
        });
      }
    });

    // Calculate percentages
    Object.keys(subjectAttendance).forEach(subject => {
      const data = subjectAttendance[subject];
      data.percentage = Math.round((data.present / workingDays) * 100);
    });

    // Overall attendance
    const totalPresent = student.attendance.filter(att => att.present).length;
    const overallPercentage = Math.round((totalPresent / workingDays) * 100);

    res.json({
      overallPercentage,
      totalPresent,
      workingDays,
      subjectAttendance,
      absentDates: absentDates.sort((a, b) => new Date(b.date) - new Date(a.date))
    });

  } catch (error) {
    console.error('Get student attendance summary error:', error);
    res.status(500).json({ error: 'Server error' }); // Changed to error
  }
});

export default router;