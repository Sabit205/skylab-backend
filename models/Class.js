const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // e.g., "Grade 10 - Section A"
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the teacher User
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);