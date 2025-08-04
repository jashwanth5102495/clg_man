import express from 'express';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import { verifyToken } from './authRoutes.js';
import mongoose from 'mongoose';

const router = express.Router();

// Create new class
router.post('/create', async (req, res) => {
  try {
    const {
      classStrength,
      boys,
      girls,
      course,
      university,
      year,
      semester,
      teacherId,
      subjects
    } = req.body;

    console.log('Received payload:', req.body);

    // Validate teacherId
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: 'Invalid class teacher ID format' });
    }

    // Check if teacher exists in Faculty collection
    const teacher = await Faculty.findOne({ user: teacherId }).populate('user');
    if (!teacher) {
      return res.status(404).json({ message: 'Class teacher not found in Faculty collection' });
    }

    // Validate subjects
    if (!subjects || subjects.length === 0) {
      return res.status(400).json({ message: 'At least one subject is required' });
    }

    // Validate each subject's teacherId and map to schema
    const formattedSubjects = subjects.map(subject => ({
      name: subject.name,
      teacher: subject.teacherId
    }));

    for (const subject of formattedSubjects) {
      if (!subject.name || !subject.teacher) {
        return res.status(400).json({ message: `Invalid subject data: ${subject.name || 'Unnamed subject'} is missing name or teacher ID` });
      }
      if (!mongoose.Types.ObjectId.isValid(subject.teacher)) {
        return res.status(400).json({ message: `Invalid teacher ID format for subject ${subject.name}` });
      }
      const subjectTeacher = await Faculty.findOne({ user: subject.teacher }).populate('user');
      if (!subjectTeacher) {
        return res.status(404).json({ message: `Teacher not found for subject ${subject.name}` });
      }
    }

    // Generate class code
    const classCode = Class.generateClassCode(university, course, year, semester);

    // Check if class code already exists
    const existingClass = await Class.findOne({ classCode });
    if (existingClass) {
      return res.status(400).json({ message: 'Class with this code already exists' });
    }

    // Generate simple sequential classId
    const lastClass = await Class.findOne().sort({ createdAt: -1 });
    let nextClassId = '00001';
    if (lastClass && lastClass.classId) {
      const lastId = parseInt(lastClass.classId);
      nextClassId = String(lastId + 1).padStart(5, '0');
    }

    // Create new class
    const newClass = new Class({
      classCode,
      university,
      course,
      year,
      semester,
      teacher: teacherId,
      classStrength,
      boys,
      girls,
      subjects: formattedSubjects,
      classId: nextClassId
    });

    await newClass.save();

    // Populate teacher details for response
    const populatedClass = await Class.findById(newClass._id)
      .populate('teacher')
      .populate('subjects.teacher');

    res.status(201).json({
      message: 'Class created successfully',
      classCode,
      classId: newClass.classId,
      simpleId: newClass.classId,
      teacher: populatedClass.teacher,
      subjects: populatedClass.subjects
    });
  } catch (error) {
    console.error('Class creation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field} already exists` 
      });
    }

    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Debug route to check all classes
router.get('/debug-classes', async (req, res) => {
  try {
    const allClasses = await Class.find({})
      .populate('teacher')
      .populate('subjects.teacher');
    console.log('All classes in database:', allClasses.length);
    allClasses.forEach(cls => {
      console.log(`Class: ${cls.classCode}, Teacher: ${cls.teacher ? cls.teacher._id : 'None'}`);
      cls.subjects.forEach(subject => {
        console.log(`Subject: ${subject.name}, Teacher: ${subject.teacher ? subject.teacher._id : 'None'}`);
      });
    });
    res.json({ 
      totalClasses: allClasses.length,
      classes: allClasses.map(cls => ({
        classCode: cls.classCode,
        teacherId: cls.teacher ? cls.teacher._id : null,
        teacherName: cls.teacher ? cls.teacher.name : null,
        subjects: cls.subjects.map(subject => ({
          name: subject.name,
          teacherId: subject.teacher ? subject.teacher._id : null,
          teacherName: subject.teacher ? subject.teacher.name : null
        }))
      }))
    });
  } catch (error) {
    console.error('Debug classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teacher's own class data (authenticated route)
router.get('/my-class', verifyToken, async (req, res) => {
  try {
    console.log('=== MY-CLASS ROUTE HIT ===');
    console.log('User:', req.user);

    if (req.user.role !== 'faculty') {
      console.log('Access denied - role:', req.user.role);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Looking for class with teacher:', req.user.userId);
    const classDoc = await Class.findOne({ teacher: req.user.userId })
      .populate('teacher')
      .populate('subjects.teacher');

    if (!classDoc) {
      console.log('Class not found for teacher:', req.user.userId);
      const allClasses = await Class.find({}).select('classCode');
      console.log('Available classes:', allClasses.map(c => c.classCode));
      return res.status(404).json({
        message: 'Class not found',
        searchedFor: req.user.userId,
        availableClasses: allClasses.map(c => c.classCode)
      });
    }

    console.log('Returning class data:', classDoc.classCode);
    res.json({
      class: {
        classId: classDoc.classId,
        classCode: classDoc.classCode,
        teacherName: classDoc.teacher ? classDoc.teacher.name : req.user.username,
        university: classDoc.university,
        course: classDoc.course,
        year: classDoc.year,
        semester: classDoc.semester,
        subjects: classDoc.subjects.map(subject => ({
          name: subject.name,
          teacherId: subject.teacher ? subject.teacher._id : null,
          teacherName: subject.teacher ? subject.teacher.name : null
        }))
      }
    });
  } catch (error) {
    console.error('Get teacher class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all classes for admin dashboard
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find({}, {
      classId: 1,
      classCode: 1,
      university: 1,
      course: 1,
      year: 1,
      semester: 1,
      teacher: 1,
      classStrength: 1,
      boys: 1,
      girls: 1,
      subjects: 1,
      workingDays: 1,
      createdAt: 1,
      isActive: 1
    })
      .populate('teacher')
      .populate('subjects.teacher')
      .sort({ createdAt: -1 });

    res.json({ 
      classes: classes.map(cls => ({
        ...cls.toObject(),
        teacherName: cls.teacher ? cls.teacher.name : null,
        subjects: cls.subjects.map(subject => ({
          name: subject.name,
          teacherId: subject.teacher ? subject.teacher._id : null,
          teacherName: subject.teacher ? subject.teacher.name : null
        }))
      }))
    });
  } catch (error) {
    console.error('Get all classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get class details by classId (public route)
router.get('/id/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const classDoc = await Class.findOne({ classId })
      .populate('studentIds')
      .populate('teacher')
      .populate('subjects.teacher');
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    console.log('Class found:', classDoc);

    res.json({ 
      class: {
        ...classDoc.toObject(),
        teacherName: classDoc.teacher ? classDoc.teacher.name : null,
        subjects: classDoc.subjects.map(subject => ({
          name: subject.name,
          teacherId: subject.teacher ? subject.teacher._id : null,
          teacherName: subject.teacher ? subject.teacher.name : null
        }))
      }
    });
  } catch (error) {
    console.error('Get class by classId error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get class details
router.get('/:classCode', verifyToken, async (req, res) => {
  try {
    const { classCode } = req.params;

    const classDoc = await Class.findOne({ classCode })
      .populate('studentIds')
      .populate('teacher')
      .populate('subjects.teacher');
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user has permission to view this class
    if (req.user.type === 'teacher' && !classDoc.teacher.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      classInfo: {
        classCode: classDoc.classCode,
        university: classDoc.university,
        course: classDoc.course,
        year: classDoc.year,
        semester: classDoc.semester,
        teacherId: classDoc.teacher ? classDoc.teacher._id : null,
        teacherName: classDoc.teacher ? classDoc.teacher.name : null,
        classStrength: classDoc.classStrength,
        boys: classDoc.boys,
        girls: classDoc.girls,
        totalStudents: classDoc.studentIds.length,
        subjects: classDoc.subjects.map(subject => ({
          name: subject.name,
          teacherId: subject.teacher ? subject.teacher._id : null,
          teacherName: subject.teacher ? subject.teacher.name : null
        }))
      }
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete class
router.delete('/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    
    const deletedClass = await Class.findOneAndDelete({ classId });
    
    if (!deletedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Also delete associated students
    await Student.deleteMany({ classCode: deletedClass.classCode });

    res.json({ message: 'Class and associated students deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get class statistics
router.get('/:classCode/stats', verifyToken, async (req, res) => {
  try {
    const { classCode } = req.params;

    const students = await Student.find({ classCode });
    
    if (students.length === 0) {
      return res.json({
        totalStudents: 0,
        averageAttendance: 0,
        passRate: 0,
        averageMarks: 0
      });
    }

    // Calculate statistics
    const totalStudents = students.length;
    const totalAttendance = students.reduce((sum, student) => sum + student.getAttendancePercentage(), 0);
    const averageAttendance = Math.round(totalAttendance / totalStudents);

    const passedStudents = students.filter(student => {
      const avgMarks = student.getAverageMarks('semester');
      return avgMarks >= 50;
    }).length;
    const passRate = Math.round((passedStudents / totalStudents) * 100);

    const totalMarks = students.reduce((sum, student) => sum + student.getAverageMarks('semester'), 0);
    const averageMarks = Math.round(totalMarks / totalStudents);

    res.json({
      totalStudents,
      averageAttendance,
      passRate,
      averageMarks
    });
  } catch (error) {
    console.error('Get class stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update working days for a class
// Update working days for a class
router.put('/:classId/working-days', async (req, res) => {
  try {
    console.log("Request for updating working days received:", req.body);

    const { classId } = req.params;
    const { workingDays } = req.body;

    if (!workingDays || workingDays < 50 || workingDays > 365) {
      return res.status(400).json({ message: 'Working days must be between 50 and 365' });
    }

    console.log('Updating working days for class:', classId, 'to', workingDays);
    // First check if working days are already set
    const existingClass = await Class.findOne({ classId });
    console.log('Existing class found:', existingClass);
    
    if (!existingClass) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // If working days are already set, don't allow changes
    if (existingClass.workingDays && existingClass.workingDaysLocked) {
      return res.status(400).json({ 
        message: 'Working days have already been set and cannot be changed',
        class: existingClass.toObject()
      });
    }

    // Update with working days and lock it
    const updatedClass = await Class.findOneAndUpdate(
      { classId }, // Query by classId field
      { 
        workingDays: workingDays,
        workingDaysLocked: true
      },
      { new: true }
    ).populate('teacher').populate('subjects.teacher');

    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ 
      message: 'Working days updated successfully and locked',
      class: {
        ...updatedClass.toObject(),
        teacherName: updatedClass.teacher ? updatedClass.teacher.name : null,
        subjects: updatedClass.subjects.map(subject => ({
          name: subject.name,
          teacherId: subject.teacher ? subject.teacher._id : null,
          teacherName: subject.teacher ? subject.teacher.name : null
        }))
      }
    });
  } catch (error) {
    console.error('Update working days error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;