import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import User from '../models/User.js';

const router = express.Router();

// Teacher login
router.post('/teacher/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find class by username
    const classDoc = await Class.findOne({ 'credentials.username': username });
    if (!classDoc) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For demo purposes, accept any password for existing usernames
    const isMatch = true; // Temporary bypass
    // Uncomment for production:
    // const isMatch = await classDoc.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        classId: classDoc._id,
        classCode: classDoc.classCode,
        type: 'teacher'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      classInfo: {
        classCode: classDoc.classCode,
        university: classDoc.university,
        course: classDoc.course,
        year: classDoc.year,
        semester: classDoc.semester,
        teacherName: classDoc.teacherName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Student login
router.post('/student/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find student by username
    const student = await Student.findOne({ 'credentials.username': username });
    if (!student) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    if (student.credentials.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        studentId: student._id,
        classCode: student.classCode,
        type: 'student'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      studentInfo: {
        name: student.name,
        classCode: student.classCode,
        rollNumber: student.rollNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unified login for admin and faculty (teacher)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  // Only allow admin or faculty to login here
  if (!['admin', 'faculty'].includes(user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  // If faculty, fetch class info and send in response
  if (user.role === 'faculty') {
    console.log("user: ",user);
    // Find the class where this faculty is the teacher
    const classDoc = await Class.findOne({ teacher: user._id });

    console.log('Class Doc:', classDoc);

    return res.json({
      token,
      user: { username: user.username, role: user.role, name: user.name },
      classInfo: {
        classId: classDoc ? classDoc._id : undefined ,
        classCode: classDoc ? classDoc.classCode : undefined,
        teacherName: user.name,
        university: classDoc ? classDoc.university : undefined,
        course: classDoc ? classDoc.course: undefined,
        year: classDoc ? classDoc.year : undefined,
        semester: classDoc ? classDoc.semester: undefined
      }
    });
  }

  // If admin, send normal response
  res.json({ token, user: { username: user.username, role: user.role, name: user.name } });
});

// Verify token middleware
export const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware for route protection
export const requireAuth = (roles = []) => (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default router;