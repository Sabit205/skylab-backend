require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const PORT = process.env.PORT || 3500;

// Connect to MongoDB Database
connectDB();

// Core Middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true,
}));
app.use(express.json()); // To parse JSON bodies
app.use(cookieParser()); // To parse cookies
app.use(express.urlencoded({ extended: false })); // To parse URL-encoded bodies

// --- API Routes ---
app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/classes', require('./routes/classRoutes'));
app.use('/announcements', require('./routes/announcementRoutes'));
app.use('/finance', require('./routes/financeRoutes'));
app.use('/schedules', require('./routes/scheduleRoutes'));
app.use('/fees', require('./routes/feeRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));

// Custom Error Handling Middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));