/* setAdmin.js - temporary script to make a user admin */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const User = require('./models/user');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const u = await User.findOne({ email: 'tester@healthify.com' });
    if (!u) { console.error('User not found'); process.exit(1); }
    u.role = 'admin';
    await u.save();
    console.log('Updated user to admin:', u._id.toString());
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
run();
