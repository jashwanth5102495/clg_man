import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  collegeId: { type: String, required: true },
  name: { type: String, required: true },
  subjects: [{ type: String, required: true }], // List of subjects taught
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who created
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Faculty', facultySchema);