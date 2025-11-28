// config/db.js
const mongoose = require('mongoose');

let cached = global._mongoClientPromise;

async function connectDB(uri) {
  if (cached) return cached;
  if (!uri) throw new Error('Please provide MONGODB_URI');

  const opts = { useNewUrlParser: true, useUnifiedTopology: true };

  const connPromise = mongoose.connect(uri, opts)
    .then(m => {
      console.log("🗄️  MongoDB connected");
      return m;
    })
    .catch(err => {
      console.error("MongoDB connection error:", err);
      throw err;
    });

  global._mongoClientPromise = connPromise;
  cached = connPromise;
  return cached;
}

module.exports = connectDB;
