const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB connection (serverless-safe cache) ---
let cached = global._mongooseCache;
if (!cached) cached = global._mongooseCache = { conn: null, promise: null };

async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI set nahi hai');
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    console.error('DB error:', e.message);
    res.status(500).json({ error: 'Database connection fail: ' + e.message });
  }
});

// --- API routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api', (req, res) => res.status(404).json({ error: 'API route nahi mila' }));

// --- Frontend ---
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

module.exports = app;
