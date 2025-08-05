const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: {
        type: String,
        required: function() { return this.role === 'Admin' || this.role === 'Teacher'; },
        unique: true,
        sparse: true,
    },
    indexNumber: {
        type: String,
        required: function() { return this.role === 'Student'; },
        unique: true,
        sparse: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['Student', 'Teacher', 'Admin'], required: true },
    status: { type: String, enum: ['Pending', 'Approved'], default: 'Pending' },
    
    // --- NEW/UPDATED FIELDS ---
    class: { // The class a student is enrolled in
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: function() { return this.role === 'Student'; }
    },
    phone: { type: String },
    profilePictureUrl: { type: String, default: '' },

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);