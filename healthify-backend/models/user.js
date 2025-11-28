// models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, validate: [validator.isEmail, "Invalid email"] },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ["user","admin"], default: "user" },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.SALT_ROUNDS || '10', 10);
  const salt = await bcrypt.genSalt(rounds);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
