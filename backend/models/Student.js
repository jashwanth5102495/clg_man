import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  parentName: { type: String },
  address: { type: String },
  university: { type: String, required: true },
  course: { type: String, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  credentials: {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  attendance: [{
    subject: { type: String, required: true },
    date: { type: Date, required: true },
    present: { type: Boolean, required: true },
    attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }
  }],
  marks: [{
    subject: { type: String, required: true },
    marks: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    type: { type: String, enum: ['internal', 'semester'], required: true },
    date: { type: Date, required: true }
  }]
});

// Calculate attendance percentage
studentSchema.methods.getAttendancePercentage = async function () {
  if (!this.attendance || this.attendance.length === 0) return 0;
  const presentCount = this.attendance.filter(record => record.present).length;
  return (presentCount / this.attendance.length) * 100;
};

// Get attendance status
studentSchema.methods.getAttendanceStatus = async function () {
  const percentage = await this.getAttendancePercentage();
  return {
    percentage,
    status: percentage >= 75 ? 'Good' : percentage >= 50 ? 'Warning' : 'Critical',
    message: percentage >= 75 ? 'Attendance is satisfactory' : 'Attendance needs improvement',
    needsAction: percentage < 75
  };
};

// Calculate average marks for a given type
studentSchema.methods.getAverageMarks = function (type) {
  const marksArray = this.marks.filter(m => m.type === type);
  if (!marksArray.length) return 0;
  const total = marksArray.reduce((sum, record) => sum + record.marks, 0);
  return total / marksArray.length;
};

// Synchronous versions for compatibility with original route
studentSchema.methods.getAttendancePercentageSync = function () {
  if (!this.attendance || this.attendance.length === 0) return 0;
  const presentCount = this.attendance.filter(record => record.present).length;
  return (presentCount / this.attendance.length) * 100;
};

studentSchema.methods.getAttendanceStatusSync = function () {
  const percentage = this.getAttendancePercentageSync();
  return {
    percentage,
    status: percentage >= 75 ? 'Good' : percentage >= 50 ? 'Warning' : 'Critical',
    message: percentage >= 75 ? 'Attendance is satisfactory' : 'Attendance needs improvement',
    needsAction: percentage < 75
  };
};

export default mongoose.model('Student', studentSchema);