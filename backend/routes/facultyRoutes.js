// routes/facultyRoutes.js
import express from 'express';
import Faculty from '../models/Faculty.js';
import User from '../models/User.js';
import { requireAuth } from '../routes/authRoutes.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Only admin can create faculty
router.post('/create', requireAuth(['admin']), async (req, res) => {
  try {
    const { name, username, password, collegeId, subjects } = req.body;

    if (!name || !username || !password || !collegeId || !subjects) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Create User
    const user = new User({
      name,
      username,
      password: hashedPassword,
      role: 'faculty',
      collegeId
    });
    await user.save();

    console.log('User created:', user);
    
    // Create Faculty
    const faculty = new Faculty({
      user: user._id,
      name,
      collegeId,
      subjects: Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim()),
      createdBy: req.user._id
    });
    await faculty.save();

    console.log('Faculty created:', faculty);
    
    res.status(201).json({ user, faculty });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Only faculty can access their dashboard data
router.get('/faculty-dashboard', requireAuth(['faculty']), async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user.userId }).populate('classes');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.status(200).json(faculty);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all faculty (for dropdowns, etc.)
router.get('/', requireAuth(['admin', 'faculty']), async (req, res) => {
  try {
    // Populate user info for each faculty
    const faculty = await Faculty.find().populate('user', 'name username collegeId');
    res.status(200).json({ faculty });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;