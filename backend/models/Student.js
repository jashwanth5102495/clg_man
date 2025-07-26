import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  parentName: { type: String },
  address: { type: String },
  university: { type: String, required: true },
  course: { type: String, required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
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

export default mongoose.model('Student', studentSchema);