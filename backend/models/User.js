import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student', 'faculty'], required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  collegeId: { type: String }, // For faculty
  studentId: { type: String }, // For student
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);