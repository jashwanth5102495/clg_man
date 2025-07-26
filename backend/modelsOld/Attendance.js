import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  classCode: {
    type: String,
    required: true,
    ref: 'Class'
  },
  subject: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  students: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    rollNumber: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    present: {
      type: Boolean,
      required: true
    }
  }],
  totalStudents: {
    type: Number,
    required: true
  },
  presentCount: {
    type: Number,
    required: true
  },
  absentCount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance for same class, subject, and date
attendanceSchema.index({ classCode: 1, subject: 1, date: 1 }, { unique: true });

// Method to calculate attendance statistics
attendanceSchema.methods.calculateStats = function() {
  this.totalStudents = this.students.length;
  this.presentCount = this.students.filter(s => s.present).length;
  this.absentCount = this.totalStudents - this.presentCount;
};

// Pre-save hook to calculate stats
attendanceSchema.pre('save', function(next) {
  this.calculateStats();
  next();
});

export default mongoose.model('Attendance', attendanceSchema);