const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    // --- References for linking (still useful) ---
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    
    // --- Denormalized data for historical accuracy ---
    studentName: { type: String, required: true },
    studentIndex: { type: String, required: true, index: true },
    className: { type: String, required: true },

    // --- Payment Details ---
    amount: {
        type: Number,
        required: true,
    },
    months: {
        type: [String], // e.g., ["January", "February"]
        required: true,
    },
    notes: {
        type: String,
    },
}, { timestamps: true });

// Note: We are using studentIndex for lookups instead of the old indexNumber field
// to be clear about its purpose.

module.exports = mongoose.model('Fee', feeSchema);