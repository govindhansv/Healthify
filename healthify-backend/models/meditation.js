const mongoose = require('mongoose');
const slugify = require('slugify');

const MeditationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a meditation title'],
    unique: true,
    trim: true,
  },
  slug: String,
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  duration: {
    type: Number, // Duration in seconds
    required: [true, 'Please add a duration in seconds'],
    min: [10, 'Duration must be at least 10 seconds'],
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category', // Reference to the existing Category model
    required: [true, 'Please add a category'],
  },
  audioUrl: {
    type: String,
    required: [true, 'Please add an audio file URL'],
  },
  thumbnail: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create slug from the title
MeditationSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.models.Meditation || mongoose.model('Meditation', MeditationSchema);
