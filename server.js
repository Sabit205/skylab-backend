require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const PORT = process.env.PORT || 3500;

connectDB();

// --- THE DEFINITIVE CORS FIX ---

// 1. Define the list of trusted frontend URLs from an environment variable.
// This allows you to add your Vercel URL, your local URL, and any others in the future.
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'];

// 2. Create the CORS options object.
const corsOptions = {
    // The origin function checks if the incoming request origin is in our trusted list.
    origin: (origin, callback) => {
        // `!origin` allows requests from tools like Postman or mobile apps.
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    // This is CRITICAL for allowing cookies (like your httpOnly refresh token) to be sent.
    credentials: true,
    // Some legacy browsers (IE11, various SmartTVs) choke on 204
    optionsSuccessStatus: 200 
};

// 3. Use the configured CORS options.
app.use(cors(corsOptions));


// --- Security and Other Middleware ---
app.use(helmet());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/auth', limiter);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

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

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));