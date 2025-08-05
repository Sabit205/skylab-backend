const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    period: { type: Number, required: true },
    subject: { type: String, default: '' },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
        unique: true,
    },
    // UPDATED: The days of the week are changed here
    schedule: {
        saturday: [periodSchema],
        sunday: [periodSchema],
        monday: [periodSchema],
        tuesday: [periodSchema],
        wednesday: [periodSchema],
        thursday: [periodSchema],
    }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);