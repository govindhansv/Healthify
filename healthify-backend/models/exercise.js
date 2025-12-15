const mongoose = require('mongoose');
const slugify = require('slugify');

const exerciseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false },
  description: { type: String, default: '' },
  instructions: { type: String, default: '' },  // Step-by-step instructions
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  duration: { type: Number, default: 0 },  // Duration in seconds for timed exercises
  equipment: { type: [String], default: [] },
  image: { type: String, default: '' },
  gif: { type: String, default: '' },  // GIF URL for animated demonstration
  video: { type: String, default: '' },  // Video URL for demonstration
  createdAt: { type: Date, default: Date.now }
});

// create/update slug from title
exerciseSchema.pre('validate', function (next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.models.Exercise || mongoose.model('Exercise', exerciseSchema);
