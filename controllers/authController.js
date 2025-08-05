const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// @desc Signup
// @route POST /auth/signup
// @access Public
const signup = async (req, res) => {
    const { fullName, email, indexNumber, password, role } = req.body;

    if (!fullName || !password || !role) {
        return res.status(400).json({ message: 'All fields except email/index are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check for role-specific identifiers
    if (role === 'Student' && !indexNumber) {
        return res.status(400).json({ message: 'Index number is required for students' });
    }
    if ((role === 'Teacher' || role === 'Admin') && !email) {
        return res.status(400).json({ message: 'Email is required for teachers and admins' });
    }

    // Check for duplicates
    let duplicate;
    if (role === 'Student') {
        duplicate = await User.findOne({ indexNumber }).lean().exec();
    } else {
        duplicate = await User.findOne({ email }).lean().exec();
    }
    
    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate email or index number' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userObject = {
            fullName,
            password: hashedPassword,
            role,
            // For public signup, all users start as Pending
            // An admin must approve them.
            status: 'Pending', 
        };

        if (role === 'Student') {
            userObject.indexNumber = indexNumber;
        } else {
            userObject.email = email;
        }

        const user = await User.create(userObject);

        res.status(201).json({ message: `New ${role} ${fullName} created. Awaiting admin approval.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Login
// @route POST /auth/login
// @access Public
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

    if (!foundUser) {
        return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
    
    if (foundUser.role !== role) {
        return res.status(401).json({ message: 'Unauthorized: Role mismatch' });
    }

    if (foundUser.status === 'Pending') {
        return res.status(403).json({ message: 'Forbidden: Account is pending approval' });
    }

    const match = await bcrypt.compare(password, foundUser.password);

    if (!match) return res.status(401).json({ message: 'Unauthorized: Incorrect password' });

    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "id": foundUser._id,
                "email": foundUser.email,
                "indexNumber": foundUser.indexNumber,
                "roles": [foundUser.role]
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { "id": foundUser._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        accessToken,
        user: {
            id: foundUser._id,
            fullName: foundUser.fullName,
            role: foundUser.role,
        }
    });
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
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
                {
                    "UserInfo": {
                        "id": foundUser._id,
                        "email": foundUser.email,
                        "indexNumber": foundUser.indexNumber,
                        "roles": [foundUser.role]
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            );

            res.json({
                accessToken,
                user: {
                    id: foundUser._id,
                    fullName: foundUser.fullName,
                    role: foundUser.role,
                }
            });
        }
    );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); //No content
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'Strict', secure: true });
    res.json({ message: 'Cookie cleared' });
};

module.exports = {
    signup,
    login,
    refresh,
    logout
};