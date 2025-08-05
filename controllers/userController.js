const User = require('../models/User');
const bcrypt = require('bcrypt');

// @desc Create a new user (by Admin)
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

// @desc Get all users with filtering, searching, and pagination
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
            .populate('class', 'name') // Populate class name for display in user table
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


// @desc Update a user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Don't allow password to be updated this way for security, should be a separate "reset password" flow
        delete updates.password;

        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update user status (Approve/Reject)
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