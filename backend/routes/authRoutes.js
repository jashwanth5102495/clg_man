import express from 'express';
import jwt from 'jsonwebtoken';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import User from '../models/User.js';

const router = express.Router();

// Unified login route for admin, faculty, and student
router.post('/login', async (req, res) => {
  const { username, password, university, classId } = req.body;
  console.log('Login attempt:', { username, classId });

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
    let selectedClass = null;
    
    if (user.role === 'faculty') {
      // If classId is provided, validate faculty access to that specific class
      if (classId) {
        selectedClass = await Class.findById(classId).select('classCode classId teachers university course year semester');
        if (!selectedClass) {
          return res.status(404).json({ message: 'Selected class not found' });
        }
        
        // Check if faculty is assigned to this class
        const hasAccess = selectedClass.teachers.some(teacherId => teacherId.toString() === user._id.toString());
        if (!hasAccess) {
          return res.status(403).json({ message: 'You are not assigned to this class' });
        }
        
        classCode = selectedClass.classCode;
        console.log('Faculty access validated for class:', selectedClass.classCode);
      } else {
        // If no classId provided, find any class assigned to this faculty
        selectedClass = await Class.findOne({ teachers: user._id }).select('classCode classId');
        if (selectedClass) {
          classCode = selectedClass.classCode;
          console.log('Class found for faculty:', selectedClass.classCode);
        } else {
          console.log('No class assigned to faculty:', user._id);
        }
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
      return res.json({
        token,
        user: {
          username: user.username,
          role: user.role,
          type: 'teacher',
          name: user.name,
          collegeId: user.collegeId
        },
        classInfo: selectedClass
          ? {
              classId: selectedClass._id,
              classCode: selectedClass.classCode,
              teacherName: user.name,
              university: selectedClass.university,
              course: selectedClass.course,
              year: selectedClass.year,
              semester: selectedClass.semester
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
      collegeId: user.collegeId,
      classCode: decoded.classCode // Keep the classCode from JWT token (selected during login)
    };

    console.log('Using classCode from JWT token:', decoded.classCode);

    console.log('req.user set:', req.user);
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Verify faculty username and return faculty ID
router.post('/verify-faculty', async (req, res) => {
  const { username } = req.body;
  console.log('Faculty verification attempt:', { username });

  try {
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Find user by username and check if they are faculty
    const user = await User.findOne({ username, role: 'faculty' });
    
    if (!user) {
      console.log('Faculty not found for username:', username);
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    console.log('Faculty verification successful:', { username, facultyId: user._id });

    return res.json({
      success: true,
      facultyId: user._id,
      name: user.name
    });

  } catch (error) {
    console.error('Faculty verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during faculty verification'
    });
  }
});

export default router;