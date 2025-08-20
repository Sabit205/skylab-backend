const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: {
        type: String,
        required: function() { return this.role === 'Admin' || this.role === 'Teacher'; },
        unique: true,
        sparse: true,
        index: true,
    },
    indexNumber: {
        type: String,
        required: function() { return this.role === 'Student'; },
        unique: true,
        sparse: true,
        index: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['Student', 'Teacher', 'Admin'], required: true, index: true },
    status: { type: String, enum: ['Pending', 'Approved'], default: 'Pending' },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: function() { return this.role === 'Student'; }
    },
    phone: { type: String },
    profilePictureUrl: { type: String, default: '' },
    // --- NEW FIELD FOR GUARDIAN ACCESS ---
    guardianAccessCode: {
        type: String,
        trim: true,
        index: true,
        sparse: true, // Allows for null values to not conflict with uniqueness
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);