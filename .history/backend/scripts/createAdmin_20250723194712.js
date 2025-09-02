const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User'); // adjust path if needed

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const existingAdmin = await User.findOne({ email: 'admin@una.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      return process.exit();
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const admin = new User({
      name: 'Admin',
      email: 'admin@una.com',
      password: hashedPassword,
      role: 'admin' // Make sure your User schema has this field
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();