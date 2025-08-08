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

// Connect to MongoDB Database
connectDB();

// --- Security and Core Middleware ---

// Set security-related HTTP headers
app.use(helmet());

// Configure Cross-Origin Resource Sharing (CORS) for production
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies to be sent
    optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));

// Request logger (useful for debugging in development)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate limiting to prevent brute-force password attacks on auth routes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/auth', limiter);

// Built-in middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware for parsing cookies, essential for refresh tokens
app.use(cookieParser());


// --- Uptime Monitoring and Welcome Routes ---

// Root route to confirm the API is running for uptime monitors
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the School Dashboard API! Server is operational.' });
});

// Specific health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Backend is running.' });
});


// --- Application API Routes ---
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


// --- Error Handling ---

// Custom error handling middleware (must be last in the middleware chain)
app.use(errorHandler);


// --- Server Activation ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));