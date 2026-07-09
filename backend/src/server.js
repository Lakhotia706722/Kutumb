require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');

const path = require('path');
const authRoutes = require('./routes/auth');
const familyRoutes = require('./routes/family');
const documentRoutes = require('./routes/documents');
const alertRoutes = require('./routes/alerts');
const scoreRoutes = require('./routes/score');
const { startAlertCron } = require('./alerts/alertCron');

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
// Minimal set that meaningfully reduces attack surface without breaking the PWA.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permit same-origin scripts + images only; no inline eval.
  // Note: PDF viewer (file redirect) opens in a new tab, so this is safe.
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'"
    );
  }
  next();
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman) in dev; block in prod
      if (!origin) {
        if (process.env.NODE_ENV === 'production') {
          return callback(new Error('Origin header required in production'));
        }
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true, // required for httpOnly cookies
  })
);

// ─── Body parsing & cookies ───────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/score', scoreRoutes);

// ─── Static file serving (local storage driver) ───────────────────────────────
// Files served at /uploads/<uuid-filename>. The UUID makes filenames
// unguessable. Production should swap to S3 signed URLs instead.
const uploadDir = path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// Never expose stack traces. Log the full error server-side only.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // CORS errors surface here — give a clear message
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ message: err.message });
  }

  console.error('[Unhandled error]', {
    method: req.method,
    path: req.path,
    message: err.message,
    stack: isDev ? err.stack : undefined,
  });

  // Never send stack traces to the client
  res.status(err.status || 500).json({
    message: isDev ? err.message : 'An unexpected error occurred. Please try again.',
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Kutumb backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    startAlertCron();
  });
});

module.exports = app;
