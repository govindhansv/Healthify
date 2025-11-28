const mongoose = require('mongoose');
const slugify = require('slugify');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  dosage: { type: String, default: '' },
  unit: { type: String, default: '' },
  frequency: { type: String, default: '' },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now }
});

medicineSchema.pre('validate', function(next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);
