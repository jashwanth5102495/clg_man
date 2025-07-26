import express from 'express';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import { verifyToken } from './authRoutes.js';

const router = express.Router();

// Take attendance for a subject
router.post('/take', verifyToken, async (req, res) => {
  try {
    console.log('=== TAKE ATTENDANCE START ===');
    console.log('User:', req.user);
    console.log('Request body:', req.body);

    if (req.user.type !== 'teacher') {
      console.log('Access denied - user type:', req.user.type);
      return res.status(403).json({ message: 'Access denied - not a teacher' });
    }

    if (!req.user.classCode) {
      console.log('No classCode in user token');
      return res.status(400).json({ message: 'Invalid user token - missing classCode' });
    }

    const { subject, date, attendanceData } = req.body;
    
    if (!subject || !date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ message: 'Missing required fields: subject, date, attendanceData' });
    }

    console.log(`Taking attendance for subject: ${subject}, date: ${date}, students: ${attendanceData.length}`);

    // Get teacher's class
    const classDoc = await Class.findOne({ classCode: req.user.classCode });
    if (!classDoc) {
      console.log('Class not found for classCode:', req.user.classCode);
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log('Found class:', classDoc.classCode);

    // Check if attendance already exists for this date and subject
    const attendanceDate = new Date(date);
    const existingAttendance = await Attendance.findOne({
      classCode: classDoc.classCode,
      subject,
      date: {
        $gte: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate()),
        $lt: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate() + 1)
      }
    });

    if (existingAttendance) {
      console.log('Attendance already exists for this date and subject');
      return res.status(400).json({ 
        message: 'Attendance already taken for this subject on this date' 
      });
    }

    // Prepare attendance record
    const students = [];
    const studentUpdates = [];
    let processedCount = 0;

    for (const record of attendanceData) {
      try {
        const student = await Student.findById(record.studentId);
        if (!student) {
          console.log(`Student not found: ${record.studentId}`);
          continue;
        }

        if (student.classCode !== classDoc.classCode) {
          console.log(`Student ${student.name} not in correct class`);
          continue;
        }

        students.push({
          studentId: student._id,
          rollNumber: student.rollNumber,
          name: student.name,
          present: record.present
        });

        // Add attendance record to student
        student.attendance.push({
          subject,
          date: attendanceDate,
          present: record.present
        });

        studentUpdates.push(student.save());
        processedCount++;
        
        console.log(`Processed student: ${student.name} - ${record.present ? 'Present' : 'Absent'}`);
      } catch (studentError) {
        console.error(`Error processing student ${record.studentId}:`, studentError);
      }
    }

    if (students.length === 0) {
      return res.status(400).json({ message: 'No valid students found to record attendance' });
    }

    // Create attendance record
    const attendance = new Attendance({
      classCode: classDoc.classCode,
      subject,
      date: attendanceDate,
      teacherName: classDoc.teacherName,
      students
    });

    console.log(`Saving attendance record with ${students.length} students`);

    // Save attendance and update all students
    await Promise.all([attendance.save(), ...studentUpdates]);

    // Update attendance ID in student records
    for (const studentRecord of students) {
      try {
        const studentDoc = await Student.findById(studentRecord.studentId);
        if (studentDoc) {
          const attendanceRecord = studentDoc.attendance.find(
            att => att.subject === subject && 
            att.date.toDateString() === attendanceDate.toDateString()
          );
          if (attendanceRecord) {
            attendanceRecord.attendanceId = attendance._id;
            await studentDoc.save();
          }
        }
      } catch (updateError) {
        console.error(`Error updating attendance ID for student ${studentRecord.studentId}:`, updateError);
      }
    }

    const presentCount = students.filter(s => s.present).length;
    const absentCount = students.length - presentCount;

    console.log(`Attendance recorded successfully: ${presentCount}/${students.length} present`);

    res.json({
      message: 'Attendance recorded successfully',
      attendanceId: attendance._id,
      subject,
      date: attendanceDate,
      totalStudents: students.length,
      presentCount,
      absentCount,
      processedStudents: processedCount
    });

  } catch (error) {
    console.error('Take attendance error:', error);
    res.status(500).json({ 
      message: 'Server error while recording attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get attendance records for a class
router.get('/class/:classCode', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { classCode } = req.params;

    if (req.user.classCode !== classCode) {
      return res.status(403).json({ message: 'Access denied to this class' });
    }

    const attendanceRecords = await Attendance.find({ classCode })
      .sort({ date: -1, subject: 1 });

    res.json({ attendanceRecords });

  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance for a specific date and subject
router.get('/details/:attendanceId', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { attendanceId } = req.params;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (req.user.classCode !== attendance.classCode) {
      return res.status(403).json({ message: 'Access denied to this attendance record' });
    }

    res.json({ attendance });

  } catch (error) {
    console.error('Get attendance details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update attendance record
router.put('/update/:attendanceId', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { attendanceId } = req.params;
    const { attendanceData } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (req.user.classCode !== attendance.classCode) {
      return res.status(403).json({ message: 'Access denied to this attendance record' });
    }

    // Update attendance record
    attendance.students = attendanceData.map(record => ({
      studentId: record.studentId,
      rollNumber: record.rollNumber,
      name: record.name,
      present: record.present
    }));

    await attendance.save();

    // Update student records
    const studentUpdates = [];
    for (const record of attendanceData) {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's attendance summary
router.get('/student/summary', verifyToken, async (req, res) => {
  try {
    if (req.user.type !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(req.user.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
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
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;