require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const ApiError = require('./utils/ApiError');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This origin is not allowed by the BALA API.'));
  },
  credentials: true,
}));
app.use(express.json({ limit: `${Math.max(1, Number(process.env.UPLOAD_MAX_MB || 8) + 2)}mb` }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60 * 1000, limit: 180, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok', service: 'BALA API' } }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/voice', require('./routes/voiceRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/volunteers', require('./routes/volunteerRoutes'));
app.use('/api/calls', require('./routes/callRoutes'));
app.use('/api/hazards', require('./routes/hazardRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/sos', require('./routes/sosRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/navigation', require('./routes/navigationRoutes'));
app.use('/api/offline', require('./routes/offlineRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use((req, res, next) => next(new ApiError(404, 'The requested API endpoint was not found.')));
app.use(errorHandler);

module.exports = app;
