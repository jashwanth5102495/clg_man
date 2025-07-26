import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  classCode: { type: String, required: true, unique: true },
  university: { type: String, required: true },
  course: { type: String, required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Class teacher
  classStrength: { type: Number, required: true },
  boys: { type: Number, required: true },
  girls: { type: Number, required: true },
  subjects: [{
    name: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  workingDays: { type: Number, default: 0 },
  workingDaysLocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  classId: { type: String, unique: true } // Added classId to schema to match usage in routes
});

// Static method to generate classCode
classSchema.statics.generateClassCode = function (university, course, year, semester) {
  // Create a unique class code, e.g., "BCU-MCA-1-1" for BCU, MCA, 1st year, 1st semester
  return `${university}-${course}-${year}-${semester}`;
};

export default mongoose.model('Class', classSchema);