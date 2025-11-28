const mongoose = require('mongoose');
const slugify = require('slugify');

const exerciseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false },
  description: { type: String, default: '' },
  difficulty: { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  duration: { type: Number, default: 0 },
  equipment: { type: [String], default: [] },
  image: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// create/update slug from title
exerciseSchema.pre('validate', function(next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.models.Exercise || mongoose.model('Exercise', exerciseSchema);
