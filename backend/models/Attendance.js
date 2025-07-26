import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  classCode: { type: String, required: true },
  subject: { type: String, required: true },
  date: { type: Date, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    rollNumber: { type: String, required: true },
    name: { type: String, required: true },
    present: { type: Boolean, required: true }
  }],
  totalStudents: { type: Number, required: true },
  presentCount: { type: Number, required: true },
  absentCount: { type: Number, required: true }
});

attendanceSchema.index({ classCode: 1, subject: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);