const mongoose = require('mongoose');

const subjectResultSchema = new mongoose.Schema({
    subjectName: { type: String, required: true },
    marks: { type: Number, required: true },
    grade: { type: String, required: true },
    remarks: { type: String, default: '' },
}, { _id: false });

const resultSchema = new mongoose.Schema({
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
    examType: {
        type: String, // e.g., "Half Yearly", "Annual"
        required: true,
    },
    results: [subjectResultSchema],
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);