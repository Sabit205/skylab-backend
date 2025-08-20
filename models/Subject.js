const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    code: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true,
        sparse: true, // Allows multiple null values for code
    },
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);