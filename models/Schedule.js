const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    period: { type: Number, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        default: null,
    },
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
    },
    weekStartDate: {
        type: Date,
        required: true,
    },
    schedule: {
        saturday: [periodSchema],
        sunday: [periodSchema],
        monday: [periodSchema],
        tuesday: [periodSchema],
        wednesday: [periodSchema],
        thursday: [periodSchema],
    }
}, { timestamps: true });

// --- THE DEFINITIVE FIX IS HERE ---
// This tells MongoDB that the COMBINATION of a class and a week must be unique.
// This is the correct business logic for your feature.
scheduleSchema.index({ classId: 1, weekStartDate: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);