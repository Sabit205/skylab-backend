const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * @desc    Register a new user (Student or Teacher)
 * @route   POST /auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
    // Correctly destructure `class` from the request body, renaming it to classId to avoid keyword conflict.
    const { fullName, email, indexNumber, password, role, class: classId } = req.body;

    // Although Joi validation middleware is in place, these checks provide an extra layer of defense.
    if (!fullName || !password || !role) {
        return res.status(400).json({ message: 'Full name, password, and role are required.' });
    }
    
    // Check for duplicate identifier based on the user's role
    let duplicate;
    if (role === 'Student') {
        if (!indexNumber) return res.status(400).json({ message: 'Index number is required for students.' });
        duplicate = await User.findOne({ indexNumber }).lean().exec();
    } else { // Role is 'Teacher'
        if (!email) return res.status(400).json({ message: 'Email is required for teachers.' });
        duplicate = await User.findOne({ email }).lean().exec();
    }
    
    if (duplicate) {
        return res.status(409).json({ message: 'A user with this email or index number already exists.' });
    }

    try {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Prepare the user object to be saved to the database
        const userObject = {
            fullName,
            password: hashedPassword,
            role,
            status: 'Pending', // All public signups must be approved by an admin
        };

        if (role === 'Student') {
            userObject.indexNumber = indexNumber;
            // Add the classId to the user object. This is the critical fix.
            userObject.class = classId;
        } else {
            userObject.email = email;
        }

        // Create the new user in the database
        await User.create(userObject);
        res.status(201).json({ message: `New ${role} ${fullName} created. Your account is now pending admin approval.` });

    } catch (error) {
        // Catch any database or other errors
        console.error("Signup Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Authenticate a user and return tokens
 * @route   POST /auth/login
 * @access  Public
 */
const login = async (req, res) => {
    const { identifier, password, role } = req.body;

    if (!identifier || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    let foundUser;
    if (role === 'Student') {
        foundUser = await User.findOne({ indexNumber: identifier }).exec();
    } else {
        foundUser = await User.findOne({ email: identifier }).exec();
    }

    if (!foundUser) return res.status(401).json({ message: 'Unauthorized: User not found' });
    if (foundUser.role !== role) return res.status(401).json({ message: 'Unauthorized: Role mismatch' });
    if (foundUser.status === 'Pending') return res.status(403).json({ message: 'Forbidden: Your account is pending admin approval' });

    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) return res.status(401).json({ message: 'Unauthorized: Incorrect password' });

    // Create JWTs
    const accessToken = jwt.sign(
        { "UserInfo": { "id": foundUser._id, "roles": [foundUser.role] } },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { "id": foundUser._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    // Set refresh token in a secure, httpOnly, cross-site compatible cookie
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send access token and user info to the frontend
    res.json({
        accessToken,
        user: { id: foundUser._id, fullName: foundUser.fullName, role: foundUser.role }
    });
};

/**
 * @desc    Refresh access token using the refresh token cookie
 * @route   GET /auth/refresh
 * @access  Public
 */
const refresh = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

    const refreshToken = cookies.jwt;

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' });

            const foundUser = await User.findById(decoded.id).exec();
            if (!foundUser) return res.status(401).json({ message: 'Unauthorized' });

            const accessToken = jwt.sign(
                { "UserInfo": { "id": foundUser._id, "roles": [foundUser.role] } },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            );

            res.json({
                accessToken,
                user: { id: foundUser._id, fullName: foundUser.fullName, role: foundUser.role }
            });
        }
    );
};

/**
 * @desc    Clear refresh token cookie
 * @route   POST /auth/logout
 * @access  Public
 */
const logout = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content
    
    // Clear the cookie with the same settings used to create it
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    res.json({ message: 'Cookie cleared and user logged out.' });
};

module.exports = {
    signup,
    login,
    refresh,
    logout
};