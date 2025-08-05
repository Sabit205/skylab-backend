const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Revenue', 'Expense'],
        required: true,
    },
    category: {
        type: String,
        required: true, // e.g., "Tuition Fees", "Salaries", "Utilities"
    },
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);