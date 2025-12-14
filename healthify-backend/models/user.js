// models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, validate: [validator.isEmail, "Invalid email"] },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },

  // Profile fields
  name: { type: String, trim: true, default: "" },
  age: { type: Number, min: 1, max: 150 },
  gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
  weight: { type: Number, min: 1 }, // in kg
  height: { type: Number, min: 1 }, // in cm (optional, for future use)
  profileImage: { type: String, default: "" }, // profile picture URL

  // Profile completion status
  profileCompleted: { type: Boolean, default: false },

  // Water tracking settings
  waterGoal: { type: Number, default: 8, min: 1, max: 20 }, // daily goal in glasses

  // Health Metrics
  healthMetrics: {
    cholesterol: {
      value: { type: String, default: '' },
      unit: { type: String, default: 'mg/dL' },
      updatedAt: { type: Date }
    },
    bloodSugar: {
      value: { type: String, default: '' },
      unit: { type: String, default: 'mg/dL' },
      type: { type: String, enum: ['fasting', 'postprandial', 'random'], default: 'fasting' },
      updatedAt: { type: Date }
    },
    bloodPressure: {
      value: { type: String, default: '' }, // e.g. "120/80"
      systolic: { type: Number },
      diastolic: { type: Number },
      updatedAt: { type: Date }
    }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.SALT_ROUNDS || '10', 10);
  const salt = await bcrypt.genSalt(rounds);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
