require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const MONGO_URI = process.env.MONGO_URI;

async function createAdmin() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");

  const username = 'admin';
  const password = 'admin123'; // Change after first login

  const exists = await Admin.findOne({ username });
  if (exists) {
    console.log('⚠️ Admin already exists.');
    process.exit();
  }

  const admin = new Admin({ username, password });
  await admin.save();

  console.log(`✅ Admin created: ${username}`);
  process.exit();
}

createAdmin();