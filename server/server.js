const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config();

const app = express();

// CORS — allow all origins for Vercel preview deployments
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MongoDB connection (lazy — connects once and reuses)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edutest';
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    // Do NOT process.exit() — serverless functions cannot exit
  }
};

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

const PORT = process.env.PORT || 5000;

// Only start HTTP server when running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Vercel serverless
module.exports = app;
