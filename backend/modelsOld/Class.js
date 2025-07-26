import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const classSchema = new mongoose.Schema({
  classCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  university: {
    type: String,
    required: true,
    enum: ['BCU', 'BNU']
  },
  course: {
    type: String,
    required: true,
    enum: ['MCA', 'BCA']
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: function(value) {
        if (this.course === 'MCA') {
          return value >= 1 && value <= 2;
        } else if (this.course === 'BCA') {
          return value >= 1 && value <= 3;
        }
        return false;
      },
      message: 'Year must be 1-2 for MCA or 1-3 for BCA'
    }
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: function(value) {
        if (this.course === 'MCA') {
          return value >= 1 && value <= 4;
        } else if (this.course === 'BCA') {
          return value >= 1 && value <= 6;
        }
        return false;
      },
      message: 'Semester must be 1-4 for MCA or 1-6 for BCA'
    }
  },
  teacherName: {
    type: String,
    required: true
  },
  classStrength: {
    type: Number,
    required: true
  },
  boys: {
    type: Number,
    required: true
  },
  girls: {
    type: Number,
    required: true
  },
  credentials: {
    username: {
      type: String,
      required: true,
      unique: true
    },
    hashedPassword: {
      type: String,
      required: true
    }
  },
  subjects: [{
    name: {
      type: String,
      required: true
    },
    teacherName: {
      type: String,
      required: true
    }
  }],
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  classId: {
    type: String,
    required: true,
    unique: true
  },
  workingDays: {
    type: Number,
    default: 100,
    min: 1,
    max: 365
  },
  workingDaysLocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
classSchema.pre('save', async function(next) {
  if (!this.isModified('credentials.hashedPassword')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.credentials.hashedPassword = await bcrypt.hash(this.credentials.hashedPassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
classSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.credentials.hashedPassword);
};

// Method to generate class code
classSchema.statics.generateClassCode = function(university, course, year, semester) {
  return `${university}-${course}-${year}-SEM${semester}`;
};

export default mongoose.model('Class', classSchema);