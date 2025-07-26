import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  present: {
    type: Boolean,
    required: true
  },
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance'
  }
});

const marksSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  marks: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalMarks: {
    type: Number,
    default: 100
  },
  isPassed: {
    type: Boolean,
    default: function() {
      return this.marks >= 50;
    }
  }
});

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dob: {
    type: String,
    required: true,
    match: /^\d{2}\/\d{2}\/\d{4}$/ // DD/MM/YYYY format - Updated regex
  },
  parentName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  classCode: {
    type: String,
    required: true,
    ref: 'Class'
  },
  rollNumber: {
    type: String,
    unique: true
  },
  // Generated login credentials
  credentials: {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true // This will be DOB in DD/MM/YYYY format
    }
  },
  attendance: [attendanceRecordSchema],
  internalMarks: [marksSchema],
  semesterMarks: [marksSchema],
  suggestions: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save hook to generate credentials
studentSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate username (lowercase name)
    this.credentials.username = this.name.toLowerCase().replace(/\s+/g, '');
    
    // Set password as DOB (DD/MM/YYYY format)
    this.credentials.password = this.dob;
    
    // Generate roll number if not provided
    if (!this.rollNumber) {
      this.rollNumber = `${this.classCode}-${Date.now().toString().slice(-4)}`;
    }
  }
  next();
});

// Method to calculate attendance percentage based on working days
studentSchema.methods.getAttendancePercentage = async function() {
  if (this.attendance.length === 0) return 0;
  
  // Get the class to find working days
  const Class = mongoose.model('Class');
  const classDoc = await Class.findOne({ classCode: this.classCode });
  const workingDays = classDoc?.workingDays || 100;
  
  const presentCount = this.attendance.filter(att => att.present).length;
  const totalAttendanceTaken = this.attendance.length;
  
  // Calculate percentage based on actual attendance taken
  if (totalAttendanceTaken === 0) return 0;
  
  // Use actual attendance taken for calculation
  const percentage = Math.round((presentCount / totalAttendanceTaken) * 100);
  
  console.log(`Attendance calculation for ${this.name}: ${presentCount}/${totalAttendanceTaken} = ${percentage}%`);
  return percentage;
};

// Synchronous method for backward compatibility
studentSchema.methods.getAttendancePercentageSync = function() {
  if (this.attendance.length === 0) return 0;
  
  const presentCount = this.attendance.filter(att => att.present).length;
  return Math.round((presentCount / this.attendance.length) * 100);
};

// Method to get attendance status with fine calculation
studentSchema.methods.getAttendanceStatus = async function() {
  const Class = mongoose.model('Class');
  const classDoc = await Class.findOne({ classCode: this.classCode });
  const workingDays = classDoc?.workingDays || 100;
  
  const presentCount = this.attendance.filter(att => att.present).length;
  const totalAttendanceTaken = this.attendance.length;
  
  // Calculate percentage based on actual attendance taken
  const actualPercentage = totalAttendanceTaken > 0 ? Math.round((presentCount / totalAttendanceTaken) * 100) : 0;
  
  // For fine calculation, use working days
  const workingDaysPercentage = Math.round((presentCount / workingDays) * 100);
  
  console.log(`Attendance status for ${this.name}: ${presentCount}/${totalAttendanceTaken} actual (${actualPercentage}%), ${presentCount}/${workingDays} working days (${workingDaysPercentage}%)`);
  
  if (actualPercentage >= 75) {
    return {
      status: 'Safe',
      message: 'Good attendance! Keep it up.',
      fine: 0,
      needsAction: false,
      percentage: actualPercentage,
      presentDays: presentCount,
      totalDays: totalAttendanceTaken
    };
  } else {
    const requiredDays = Math.ceil(workingDays * 0.75);
    const shortfall = Math.max(0, requiredDays - presentCount);
    const fineAmount = shortfall * 50; // ₹50 per day shortfall
    
    return {
      status: actualPercentage >= 50 ? 'Warning' : 'Danger',
      message: shortfall > 0 
        ? `Attendance: ${actualPercentage}%. You need ${shortfall} more present days to reach 75% of working days. Fine: ₹${fineAmount}. Please contact your HOD immediately.`
        : `Current attendance: ${actualPercentage}%. Keep maintaining good attendance.`,
      fine: fineAmount,
      needsAction: shortfall > 0,
      shortfall: shortfall,
      requiredDays: requiredDays,
      presentDays: presentCount,
      percentage: actualPercentage,
      totalDays: totalAttendanceTaken
    };
  }
};

// Synchronous method for backward compatibility
studentSchema.methods.getAttendanceStatusSync = function() {
  const percentage = this.getAttendancePercentageSync();
  
  if (percentage >= 75) return 'Safe';
  if (percentage >= 50) return 'Warning';
  return 'Danger';
};

// Method to calculate average marks
studentSchema.methods.getAverageMarks = function(type = 'internal') {
  const marks = type === 'internal' ? this.internalMarks : this.semesterMarks;
  
  if (marks.length === 0) return 0;
  
  const total = marks.reduce((sum, mark) => sum + mark.marks, 0);
  return Math.round(total / marks.length);
};

// Method to generate course suggestions
studentSchema.methods.generateSuggestions = function() {
  const avgInternal = this.getAverageMarks('internal');
  const avgSemester = this.getAverageMarks('semester');
  const overallAvg = Math.round((avgInternal + avgSemester) / 2);
  
  let suggestions = [];
  
  if (overallAvg >= 85) {
    suggestions = [
      'Artificial Intelligence & Machine Learning',
      'Data Science & Analytics',
      'Research & Development',
      'Software Architecture'
    ];
  } else if (overallAvg >= 70) {
    suggestions = [
      'Full Stack Web Development',
      'Mobile Application Development',
      'Cloud Computing',
      'DevOps Engineering'
    ];
  } else if (overallAvg >= 50) {
    suggestions = [
      'Cybersecurity',
      'Network Administration',
      'IT Support',
      'Database Administration'
    ];
  } else {
    suggestions = [
      'Basic Programming',
      'Computer Fundamentals',
      'IT Certification Courses',
      'Skill Development Programs'
    ];
  }
  
  this.suggestions = suggestions;
  return suggestions;
};

export default mongoose.model('Student', studentSchema);