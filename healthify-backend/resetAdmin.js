/* resetAdmin.js - wipe all users and create a fresh admin */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const User = require('./models/user');

async function run() {
  const adminEmail = 'admin@healthify.com';
  const adminPassword = 'Admin@1234';

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove all existing users
    const delResult = await User.deleteMany({});
    console.log('Deleted users count:', delResult.deletedCount);

    // Create fresh admin user
    const admin = new User({ email: adminEmail, password: adminPassword, role: 'admin' });
    await admin.save();
    console.log('Created fresh admin user:', adminEmail, 'id:', admin._id.toString());

    process.exit(0);
  } catch (err) {
    console.error('Error in resetAdmin:', err);
    process.exit(1);
  }
}

run();
