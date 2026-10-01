const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from process cwd, backend directory, and root directory
dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Provide safe development fallback for JWT_SECRET if missing
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'ums_super_secret_jwt_key_2024_university_management_system';
}
if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '7d';
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const lecturerRoutes = require('./routes/lecturers');
const courseRoutes = require('./routes/courses');
const departmentRoutes = require('./routes/departments');
const programmeRoutes = require('./routes/programmes');
const registrationRoutes = require('./routes/registrations');
const resultRoutes = require('./routes/results');
const timetableRoutes = require('./routes/timetable');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const facultyRoutes = require('./routes/faculties');
const roomRoutes = require('./routes/rooms');
const attendanceRoutes = require('./routes/attendance');
const academicYearRoutes = require('./routes/academicYears');
const semesterRoutes = require('./routes/semesters');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps)
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    if (allowed.includes(origin)) return callback(null, true);
    // In development allow any origin
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded profile images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting for general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'University Management System API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lecturers', lecturerRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/programmes', programmeRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/semesters', semesterRoutes);

// 404 & Error Handler
app.use(notFound);
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🎓 University Management System API is running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
  });
}

module.exports = app;
