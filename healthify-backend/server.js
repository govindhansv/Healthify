/* server.js (minimal) */
require('dotenv').config({ path: '.env.local' });
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const adminSummaryRoutes = require('./routes/adminSummary');
const categoriesRoutes = require('./routes/categories');
const exercisesRoutes = require('./routes/exercises');
const workoutsRoutes = require('./routes/workouts');
const meditationsRoutes = require('./routes/meditations');
const uploadsRoutes = require('./routes/uploads');
const nutritionRoutes = require('./routes/nutrition');
const medicinesRoutes = require('./routes/medicines');
const faqsRoutes = require('./routes/faqs');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  'http://localhost:3000', // admin UI
  'http://localhost:3001', // possible user UI dev port
  'http://localhost:3002', // alternative user UI dev port
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/summary', adminSummaryRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/api/meditations', meditationsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/medicines', medicinesRoutes);
app.use('/api/faqs', faqsRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
connectDB(process.env.MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`?? Server running on port ${PORT}`)))
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
