// Backend API endpoints for teacher class selection

// GET /api/classes/all - Get all available classes for teacher selection
const getAllClasses = async (req, res) => {
  try {
    // Fetch all classes from database
    const classes = await Class.find({})
      .populate('teacherId', 'name')
      .select('classCode course year semester university classStrength teacherId')
      .sort({ course: 1, year: 1, semester: 1 });

    const formattedClasses = classes.map(cls => ({
      _id: cls._id,
      classCode: cls.classCode,
      course: cls.course,
      year: cls.year,
      semester: cls.semester,
      university: cls.university,
      classStrength: cls.classStrength,
      teacherName: cls.teacherId?.name || 'Unassigned'
    }));

    res.json({
      success: true,
      classes: formattedClasses
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classes'
    });
  }
};

// POST /api/auth/login - Modified login endpoint to handle class selection
const teacherLogin = async (req, res) => {
  try {
    const { username, password, classId } = req.body;

    // Validate required fields
    if (!username || !password || !classId) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and class selection are required'
      });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify user is a teacher
    if (user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    // Find the selected class and verify teacher has access
    const selectedClass = await Class.findById(classId)
      .populate('subjects.teacherId', 'name')
      .populate('teacherId', 'name');

    if (!selectedClass) {
      return res.status(404).json({
        success: false,
        message: 'Selected class not found'
      });
    }

    // Check if teacher is assigned to this class (either as class teacher or subject teacher)
    const isClassTeacher = selectedClass.teacherId._id.toString() === user._id.toString();
    const isSubjectTeacher = selectedClass.subjects.some(subject => 
      subject.teacherId._id.toString() === user._id.toString()
    );

    if (!isClassTeacher && !isSubjectTeacher) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this class'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        classId: selectedClass._id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare class info
    const classInfo = {
      classId: selectedClass._id,
      classCode: selectedClass.classCode,
      course: selectedClass.course,
      year: selectedClass.year,
      semester: selectedClass.semester,
      university: selectedClass.university,
      teacherName: user.name,
      isClassTeacher,
      subjects: selectedClass.subjects.filter(subject => 
        isClassTeacher || subject.teacherId._id.toString() === user._id.toString()
      )
    };

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      },
      classInfo
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// Example Express routes
const routes = `
// routes/classes.js
router.get('/all', getAllClasses);

// routes/auth.js  
router.post('/login', teacherLogin);
`;

// Database schema updates needed
const schemaUpdates = {
  // No schema changes needed, existing structure supports this
  // Class model already has teacherId and subjects array
  // User model already has role field
  
  notes: [
    'No database schema changes required',
    'Existing Class and User models support this functionality',
    'JWT token now includes classId for session management',
    'Login endpoint validates teacher access to selected class'
  ]
};

module.exports = {
  getAllClasses,
  teacherLogin,
  routes,
  schemaUpdates
};