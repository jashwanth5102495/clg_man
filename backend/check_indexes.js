import mongoose from 'mongoose';
import Student from './models/Student.js';

async function checkIndexes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/student-management');
    console.log('Connected to MongoDB');
    
    // Check if students collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const studentsCollection = collections.find(col => col.name === 'students');
    
    if (studentsCollection) {
      console.log('Students collection exists');
      
      // Get indexes
      const indexes = await mongoose.connection.db.collection('students').indexes();
      console.log('Current indexes on students collection:');
      indexes.forEach(index => {
        console.log('- Index:', JSON.stringify(index, null, 2));
      });
      
      // Check document count
      const count = await mongoose.connection.db.collection('students').countDocuments();
      console.log(`Document count: ${count}`);
      
      // Check if there are any documents with rollNumber BCU-MCA-1-1-0001
      const duplicateCheck = await mongoose.connection.db.collection('students').findOne({
        rollNumber: 'BCU-MCA-1-1-0001'
      });
      
      if (duplicateCheck) {
        console.log('Found existing document with rollNumber BCU-MCA-1-1-0001:');
        console.log(JSON.stringify(duplicateCheck, null, 2));
      } else {
        console.log('No document found with rollNumber BCU-MCA-1-1-0001');
      }
    } else {
      console.log('Students collection does not exist');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

checkIndexes();