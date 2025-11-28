/* scripts/seedExercises.js - run with: node scripts/seedExercises.js */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const Exercise = require('../models/exercise');
const Category = require('../models/category');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let cat = await Category.findOne({ name: /strength/i });
    if (!cat) cat = await Category.findOne();

    const items = [
      { title: 'Push Ups', description: 'Bodyweight chest', difficulty: 'beginner', duration: 300 },
      { title: 'Squats', description: 'Legs exercise', difficulty: 'beginner', duration: 400 },
      { title: 'Plank', description: 'Core stability', difficulty: 'intermediate', duration: 180 },
      { title: 'Burpees', description: 'Full body cardio', difficulty: 'advanced', duration: 240 },
      { title: 'Lunges', description: 'Legs focus', difficulty: 'intermediate', duration: 360 }
    ];

    for (const it of items) {
      const exists = await Exercise.findOne({ title: it.title });
      if (exists) {
        console.log('Exists', it.title);
        continue;
      }
      const ex = new Exercise({
        ...it,
        category: cat ? cat._id : undefined,
        equipment: [],
        image: ''
      });
      await ex.save();
      console.log('Created', ex.title);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
