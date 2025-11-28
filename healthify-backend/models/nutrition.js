const mongoose = require('mongoose');
const slugify = require('slugify');

const nutritionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['Recipe', 'Plan', 'Tip'], default: 'Recipe' },
  image: { type: String, default: '' },
  calories: { type: Number, default: 0 },
  ingredients: { type: [String], default: [] },
  instructions: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

nutritionSchema.pre('validate', function(next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.models.Nutrition || mongoose.model('Nutrition', nutritionSchema);
