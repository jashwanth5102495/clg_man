import express from 'express';
import jwt from 'jsonwebtoken';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import User from '../models/User.js';

const router = express.Router();

// Unified login route for admin, faculty, and student
router.post('/login', async (req, res) => {
  const { username, password, university } = req.body;
  console.log('Login attempt:', { username });

  try {
    // First, try to find in User collection (admin or faculty)
    let user = await User.findOne({ username }).select('+password');
    let isStudent = false;

    // If not found in User, try Student collection
    if (!user) {
      user = await Student.findOne({ 'credentials.username': username }).populate('class');
      isStudent = true;
    }

    if (!user) {
      console.log('User not found for username:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (isStudent) {
      // Student login
      if (user.credentials.password !== password) {
        console.log('Invalid password for student:', username);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token for student
      const token = jwt.sign(
        {
          studentId: user._id,
          role: 'student',
          classCode: user.class?.classCode || null
        },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '24h' }
      );

      console.log('Student login successful:', { username, classCode: user.class?.classCode });

      return res.json({
        token,
        studentInfo: {
          name: user.name,
          classCode: user.class?.classCode || null,
          rollNumber: user.rollNumber
        }
      });
    }

    // Admin or faculty login
    if (!['admin', 'faculty'].includes(user.role)) {
      console.log('Access denied - role:', user.role);
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate password (use bcrypt in production)
    if (password !== user.password) {
      console.log('Invalid password for:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token with role and classCode (if faculty)
    let classCode = null;
    if (user.role === 'faculty') {
      const classDoc = await Class.findOne({ teacher: user._id }).select('classCode classId');
      if (classDoc) {
        classCode = classDoc.classCode;
        console.log('Class found for teacher:', classDoc.classCode);
      } else {
        console.log('No class assigned to teacher:', user._id);
      }
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        classCode: classCode
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    // If faculty, return class info
    if (user.role === 'faculty') {
      const classDoc = await Class.findOne({ teacher: user._id });
      return res.json({
        token,
        user: {
          username: user.username,
          role: user.role,
          type: 'teacher',
          name: user.name,
          collegeId: user.collegeId
        },
        classInfo: classDoc
          ? {
              classId: classDoc.classId,
              classCode: classDoc.classCode,
              teacherName: user.name,
              university: classDoc.university,
              course: classDoc.course,
              year: classDoc.year,
              semester: classDoc.semester
            }
          : null
      });
    }

    // If admin
    res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
        type: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token middleware
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token received:', token ? 'YES' : 'NO');

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('Decoded token:', decoded);

    // Handle student token
    if (decoded.role === 'student') {
      const student = await Student.findById(decoded.studentId);
      if (!student) {
        console.log('Student not found for ID:', decoded.studentId);
        return res.status(401).json({ message: 'Invalid token' });
      }
      req.user = {
        studentId: student._id,
        role: 'student',
        type: 'student',
        classCode: decoded.classCode
      };
      console.log('req.user set for student:', req.user);
      return next();
    }

    // Handle user (admin/faculty) token
    const user = await User.findById(decoded.userId).select('username role collegeId');
    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      type: user.role === 'faculty' ? 'teacher' : user.role,
      username: user.username,
      collegeId: user.collegeId
    };

    // If teacher, fetch classCode
    if (req.user.role === 'faculty') {
      const classDoc = await Class.findOne({ teacher: user._id }).select('classCode');
      if (classDoc) {
        req.user.classCode = classDoc.classCode;
        console.log('Assigned classCode to req.user:', req.user.classCode);
      } else {
        console.log('No class found for teacher:', user._id);
      }
    }

    console.log('req.user set:', req.user);
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default router;