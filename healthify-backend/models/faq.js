const mongoose = require('mongoose');
const slugify = require('slugify');

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true, unique: true },
  answer: { type: String, default: '' },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  category: { type: String, default: '' },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

faqSchema.pre('validate', function(next) {
  if (this.question && (!this.slug || this.isModified('question'))) {
    this.slug = slugify(this.question, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.models.Faq || mongoose.model('Faq', faqSchema);
