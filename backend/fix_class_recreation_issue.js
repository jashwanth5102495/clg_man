import mongoose from 'mongoose';
import Student from './models/Student.js';
import Class from './models/Class.js';

async function fixClassRecreationIssue() {
  try {
    await mongoose.connect('mongodb://localhost:27017/student-management');
    console.log('Connected to MongoDB');
    
    console.log('\n=== ANALYZING CLASS RECREATION ISSUE ===');
    
    // Check current state
    const allStudents = await Student.find({});
    const allClasses = await Class.find({});
    
    console.log(`Current students in database: ${allStudents.length}`);
    console.log(`Current classes in database: ${allClasses.length}`);
    
    if (allClasses.length > 0) {
      console.log('\nExisting classes:');
      for (const cls of allClasses) {
        console.log(`- ${cls.classCode} (ID: ${cls._id})`);
        console.log(`  Student IDs: ${cls.studentIds ? cls.studentIds.length : 0}`);
      }
    }
    
    if (allStudents.length > 0) {
      console.log('\nExisting students:');
      for (const student of allStudents) {
        console.log(`- ${student.name} (Roll: ${student.rollNumber}, Class: ${student.class})`);
        
        // Check if student's class exists
        const classExists = await Class.findById(student.class);
        if (!classExists) {
          console.log(`  ⚠️  WARNING: Student ${student.name} references non-existent class ${student.class}`);
        }
      }
    }
    
    // Check for orphaned students (students whose class doesn't exist)
    const orphanedStudents = [];
    for (const student of allStudents) {
      const classExists = await Class.findById(student.class);
      if (!classExists) {
        orphanedStudents.push(student);
      }
    }
    
    if (orphanedStudents.length > 0) {
      console.log(`\n🚨 FOUND ${orphanedStudents.length} ORPHANED STUDENTS`);
      console.log('These students reference classes that no longer exist:');
      orphanedStudents.forEach(student => {
        console.log(`- ${student.name} (Roll: ${student.rollNumber})`);
      });
      
      console.log('\n🔧 CLEANING UP ORPHANED STUDENTS...');
      const deleteResult = await Student.deleteMany({
        _id: { $in: orphanedStudents.map(s => s._id) }
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned students`);
    }
    
    // Check for classes with invalid student references
    const classesWithInvalidRefs = [];
    for (const cls of allClasses) {
      if (cls.studentIds && cls.studentIds.length > 0) {
        const validStudents = await Student.find({
          _id: { $in: cls.studentIds }
        });
        
        if (validStudents.length !== cls.studentIds.length) {
          classesWithInvalidRefs.push({
            class: cls,
            expectedStudents: cls.studentIds.length,
            actualStudents: validStudents.length
          });
        }
      }
    }
    
    if (classesWithInvalidRefs.length > 0) {
      console.log(`\n🚨 FOUND ${classesWithInvalidRefs.length} CLASSES WITH INVALID STUDENT REFERENCES`);
      
      for (const item of classesWithInvalidRefs) {
        console.log(`- Class ${item.class.classCode}: Expected ${item.expectedStudents} students, found ${item.actualStudents}`);
        
        // Get valid student IDs
        const validStudentIds = await Student.find({
          _id: { $in: item.class.studentIds }
        }).distinct('_id');
        
        // Update class with only valid student IDs
        await Class.findByIdAndUpdate(item.class._id, {
          studentIds: validStudentIds
        });
        
        console.log(`  ✅ Updated class ${item.class.classCode} with ${validStudentIds.length} valid student references`);
      }
    }
    
    // Final verification
    const finalStudentCount = await Student.countDocuments();
    const finalClassCount = await Class.countDocuments();
    
    console.log('\n✅ CLEANUP COMPLETED');
    console.log(`Final student count: ${finalStudentCount}`);
    console.log(`Final class count: ${finalClassCount}`);
    
    if (finalStudentCount === 0 && finalClassCount === 0) {
      console.log('\n🎉 Database is clean and ready for fresh class creation and CSV upload!');
    } else {
      console.log('\n📊 Current database state is consistent');
    }
    
    console.log('\n📝 RECOMMENDATIONS:');
    console.log('1. When deleting a class, ensure all associated students are also deleted');
    console.log('2. When creating a new class with the same classCode, ensure no old data conflicts');
    console.log('3. Always verify class exists before uploading CSV');
    console.log('4. Use unique student IDs to prevent conflicts');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

fixClassRecreationIssue();