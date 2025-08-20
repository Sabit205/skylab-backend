const User = require('../models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * @desc    Generate or update a guardian access code for a student
 * @route   POST /users/:id/generate-code
 * @access  Private (Admin)
 */
exports.generateGuardianCode = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        if (!student || student.role !== 'Student') {
            return res.status(404).json({ message: 'Student not found.' });
        }
        
        // Generate a simple, random 6-character alphanumeric code
        const accessCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        
        student.guardianAccessCode = accessCode;
        await student.save();

        res.json({ message: `New access code generated successfully.`, accessCode: student.guardianAccessCode });
    } catch (error) {
        res.status(500).json({ message: 'Error generating code', error: error.message });
    }
};

/**
 * @desc    Revoke (delete) a guardian access code for a student
 * @route   DELETE /users/:id/revoke-code
 * @access  Private (Admin)
 */
exports.revokeGuardianCode = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        if (!student || student.role !== 'Student') {
            return res.status(404).json({ message: 'Student not found.' });
        }
        
        student.guardianAccessCode = undefined; // Using undefined will remove the field from the document upon saving
        await student.save();

        res.json({ message: 'Access code revoked successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error revoking code', error: error.message });
    }
};

/**
 * @desc    Create a new user (by Admin)
 * @route   POST /users
 * @access  Private (Admin)
 */
exports.createUser = async (req, res) => {
    const { fullName, email, indexNumber, password, role, class: classId } = req.body;
    
    if (!fullName || !password || !role || !(email || indexNumber)) {
        return res.status(400).json({ message: 'All required fields must be provided.' });
    }
    
    const duplicate = role === 'Student'
        ? await User.findOne({ indexNumber }).lean().exec()
        : await User.findOne({ email }).lean().exec();

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate email or index number' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userObject = { fullName, password: hashedPassword, role, status: 'Approved' };
        
        if (role === 'Student') {
            if (!classId) return res.status(400).json({ message: 'A class must be assigned to the student.' });
            userObject.indexNumber = indexNumber;
            userObject.class = classId;
        } else {
            userObject.email = email;
        }
        
        const user = await User.create(userObject);
        res.status(201).json({ message: `User ${user.fullName} created successfully.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all users with filtering, searching, and pagination
 * @route   GET /users
 * @access  Private (Admin)
 */
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role, search, fields } = req.query;
        const query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { indexNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const selectFields = fields ? fields.split(',').join(' ') : '-password';

        const users = await User.find(query)
            .populate('class', 'name')
            .select(selectFields)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })
            .exec();
        
        const count = await User.countDocuments(query);

        res.json({
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update a user
 * @route   PUT /users/:id
 * @access  Private (Admin)
 */
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent password from being updated via this general endpoint for security
        delete updates.password;

        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete a user
 * @route   DELETE /users/:id
 * @access  Private (Admin)
 */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'User deleted successfully' });
    }
};

/**
 * @desc    Update user status (Approve/Pending)
 * @route   PATCH /users/:id/status
 * @access  Private (Admin)
 */
exports.updateUserStatus = async (req, res) => {
    const { status } = req.body;
    if (!status || !['Approved', 'Pending'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: `User status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};