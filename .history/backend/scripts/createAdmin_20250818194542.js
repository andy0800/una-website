require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/una_institute', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

async function createAdmin() {
  try {
    const username = process.argv[2];
    const password = process.argv[3];

    if (!username || !password) {
      console.log('\n📋 Usage: node createAdmin.js <username> <password>');
      console.log('Example: node createAdmin.js admin mySecurePassword123');
      console.log('\n⚠️  Make sure to use a strong password!');
      process.exit(1);
    }

    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    // Check if admin already exists
    const exists = await Admin.findOne({ username });
    if (exists) {
      console.log(`❌ Admin user '${username}' already exists`);
      process.exit(1);
    }

    // Create new admin
    const admin = new Admin({ username, password });
    await admin.save();

    console.log(`✅ Admin user '${username}' created successfully!`);
    console.log('🔑 You can now login to the admin panel at /admin/login.html');
    console.log('\n⚠️  Remember to delete this script after creating your admin account for security!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();