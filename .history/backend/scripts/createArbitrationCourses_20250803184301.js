const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const arbitrationCourses = [
  {
    name: 'المرحلة التمهيدية و التخصصية في التحكيم التجاري',
    nameEn: 'Preliminary and Specialized Stage in Commercial Arbitration',
    description: 'مرحلة تمهيدية شاملة تغطي أساسيات التحكيم التجاري والمبادئ الأساسية',
    descriptionEn: 'Comprehensive preliminary stage covering the basics of commercial arbitration and fundamental principles',
    duration: '3 months',
    level: 'Beginner',
    color: '#28a745', // Green
    category: 'arbitration'
  },
  {
    name: 'المرحلة المتعمقة في التحكيم التجاري',
    nameEn: 'Advanced Stage in Commercial Arbitration',
    description: 'مرحلة متقدمة تتعمق في تفاصيل التحكيم التجاري والممارسات العملية',
    descriptionEn: 'Advanced stage delving into the details of commercial arbitration and practical practices',
    duration: '6 months',
    level: 'Intermediate',
    color: '#007bff', // Blue
    category: 'arbitration'
  },
  {
    name: 'دبلوم التحكيم التجاري',
    nameEn: 'Diploma in Commercial Arbitration',
    description: 'برنامج دبلوم شامل في التحكيم التجاري مع شهادة معتمدة',
    descriptionEn: 'Comprehensive diploma program in commercial arbitration with accredited certification',
    duration: '12 months',
    level: 'Advanced',
    color: '#ffc107', // Yellow
    category: 'arbitration'
  },
  {
    name: 'ماجستير التحكيم التجاري',
    nameEn: 'Master in Commercial Arbitration',
    description: 'برنامج ماجستير متخصص في التحكيم التجاري مع بحث أكاديمي',
    descriptionEn: 'Specialized master program in commercial arbitration with academic research',
    duration: '18 months',
    level: 'Expert',
    color: '#dc3545', // Red
    category: 'arbitration'
  },
  {
    name: 'دكتوراه التحكيم التجاري',
    nameEn: 'PhD in Commercial Arbitration',
    description: 'أعلى مستوى أكاديمي في التحكيم التجاري مع أطروحة بحثية',
    descriptionEn: 'Highest academic level in commercial arbitration with research thesis',
    duration: '36 months',
    level: 'Doctorate',
    color: '#6f42c1', // Purple
    category: 'arbitration'
  }
];

async function createArbitrationCourses() {
  try {
    console.log('🔄 Creating arbitration courses...');
    
    for (const courseData of arbitrationCourses) {
      // Check if course already exists
      const existingCourse = await Course.findOne({ 
        $or: [
          { name: courseData.name },
          { nameEn: courseData.nameEn }
        ]
      });
      
      if (existingCourse) {
        console.log(`⚠️ Course "${courseData.name}" already exists, updating...`);
        await Course.findByIdAndUpdate(existingCourse._id, courseData, { new: true });
      } else {
        const newCourse = new Course(courseData);
        await newCourse.save();
        console.log(`✅ Created course: ${courseData.name}`);
      }
    }
    
    console.log('🎉 All arbitration courses created/updated successfully!');
    
    // Display all courses
    const allCourses = await Course.find();
    console.log('\n📋 Current courses in database:');
    allCourses.forEach(course => {
      console.log(`- ${course.name} (${course.color})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating courses:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

createArbitrationCourses(); 