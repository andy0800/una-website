require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/una_institute';

mongoose.connect(uri)
.then(() => {
  const dbName = mongoose.connection.db.databaseName;
  const host = mongoose.connection.host || 'localhost';
  console.log('✅ Connected to MongoDB');
  console.log(`   Database: ${dbName}`);
  console.log(`   Host: ${host}`);
  console.log(`   Collection for admins: admins`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

async function listAdmins() {
  try {
    const admins = await Admin.find({}).select('username createdAt').lean();
    if (admins.length === 0) {
      console.log('\n📋 No admin accounts found in the database.');
      console.log('   Create one with: node scripts/createAdmin.js <username> <password>');
      process.exit(0);
    }
    console.log('\n📋 Admin accounts (username only; passwords are hashed):\n');
    admins.forEach((a, i) => console.log(`   ${i + 1}. ${a.username}`));
    console.log('\n   To reset a password: node scripts/resetAdminPassword.js <username> <new-password>\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAdmins();
