const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    rating: {
        type: String,
        enum: ['Good', 'Average', 'Needs Improvement'],
        required: true,
    },
    comment: {
        type: String,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

performanceSchema.index({ student: 1, teacher: 1, subject: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Performance', performanceSchema);