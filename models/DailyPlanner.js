const mongoose = require('mongoose');

const lessonPlanSchema = new mongoose.Schema({
    subjectName: { type: String, default: '' },
    // 'studied' field is removed from here
    notStudied: { type: Boolean, default: false },
    homework: { type: String, default: '' },
    todaysLesson: { type: String, default: '' },
}, { _id: false });

const dailyPlannerSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    date: { type: Date, required: true },
    
    // Part 1
    weather: { type: String },
    todaysGoal: { type: String },
    studyGoal: { type: String },
    totalStudyTime: { type: String },
    breakTime: { type: String },
    sleepHours: { type: String },
    readingList: [{ time: String, topic: String }],
    assignmentsExams: { type: String },
    evaluationScale: { type: Number, min: 0, max: 5, default: 0 },
    selfReflection: { type: String },
    
    // Part 2
    focusTopic: { type: String },
    priorityTasks: { type: String },
    forTomorrow: { type: String },
    todoList: [{ task: String, completed: Boolean }],
    healthAndBody: { type: String },
    waterIntake: { type: Number, default: 0 },
    meals: { breakfast: Boolean, lunch: Boolean, dinner: Boolean, snacks: Boolean },
    dayOfWeek: { type: String },
    lessonPlans: [lessonPlanSchema],
    monthName: { type: String },
    totalCross: { type: String },
    cumulativeCross: { type: String },
    
    // Status Flow
    status: {
        type: String,
        enum: ['Pending', 'GuardianApproved', 'TeacherApproved', 'TeacherDeclined', 'RecalledByStudent'],
        default: 'Pending',
    },
    guardianSignature: { type: String },
    teacherDeclineComment: { type: String },
}, { timestamps: true });

dailyPlannerSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyPlanner', dailyPlannerSchema);