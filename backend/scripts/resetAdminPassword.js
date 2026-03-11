require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/una_institute';

mongoose.connect(uri)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

async function resetAdminPassword() {
  try {
    const username = process.argv[2];
    const newPassword = process.argv[3];

    if (!username || !newPassword) {
      console.log('\n📋 Usage: node resetAdminPassword.js <username> <new-password>');
      console.log('Example: node resetAdminPassword.js admin MyNewSecurePass123');
      console.log('\n⚠️  Password must be at least 8 characters.');
      process.exit(1);
    }

    if (newPassword.length < 8) {
      console.log('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log(`❌ Admin user '${username}' not found.`);
      process.exit(1);
    }

    admin.password = newPassword;
    await admin.save();

    console.log(`✅ Password updated for admin '${username}'.`);
    console.log('🔑 You can now log in with the new password.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
