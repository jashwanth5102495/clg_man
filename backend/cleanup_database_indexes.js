import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import Class from './models/Class.js';

dotenv.config();

async function cleanupDatabase() {
  try {
    console.log('=== CLEANING UP DATABASE AND INDEXES ===');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop the entire students collection to remove all data and indexes
    try {
      await mongoose.connection.db.collection('students').drop();
      console.log('✅ Dropped students collection (removed all data and indexes)');
    } catch (error) {
      if (error.code === 26) {
        console.log('ℹ️ Students collection does not exist, skipping drop');
      } else {
        throw error;
      }
    }

    // Clear student references from all classes
    const result = await Class.updateMany({}, { $set: { studentIds: [] } });
    console.log(`✅ Cleared student references from ${result.modifiedCount} classes`);

    // Recreate the collection with proper schema
    console.log('✅ Collection will be recreated automatically with new schema on next insert');

    console.log('\n🎉 DATABASE CLEANUP COMPLETED');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Restart the backend server');
    console.log('2. Try uploading the CSV file again');
    console.log('3. Students with same names will now get unique usernames (e.g., john, john1, john2)');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

cleanupDatabase();