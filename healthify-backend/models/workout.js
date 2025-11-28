const mongoose = require('mongoose');
const slugify = require('slugify');

const workoutSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  description: { type: String, default: '' },
  difficulty: { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }], // ordered
  totalDuration: { type: Number, default: 0 }, // in seconds or minutes (choose consistency)
  thumbnail: { type: String, default: '' }, // image url
  createdAt: { type: Date, default: Date.now }
});

// slug from name
workoutSchema.pre('validate', function(next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// compute totalDuration from exercises if not set or exercises changed
workoutSchema.methods.calculateTotalDuration = async function() {
  if (!this.exercises || !this.exercises.length) {
    this.totalDuration = 0;
    return this.totalDuration;
  }
  const Exercise = mongoose.model('Exercise');
  const docs = await Exercise.find({ _id: { $in: this.exercises } }).select('duration').lean();
  const sum = docs.reduce((s, d) => s + (d.duration || 0), 0);
  this.totalDuration = sum;
  return this.totalDuration;
};

workoutSchema.pre('save', async function(next) {
  try {
    // recalc totalDuration whenever exercises array changed
    if (this.isModified('exercises') || this.isNew || this.totalDuration === 0) {
      await this.calculateTotalDuration();
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.models.Workout || mongoose.model('Workout', workoutSchema);
