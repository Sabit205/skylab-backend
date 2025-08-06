const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Attendance = require('../models/Attendance');

const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
const getDayOfWeek = () => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toLowerCase();

// --- THIS FUNCTION IS BEING RESTORED ---
// @desc    Get the teacher's first period class for the current day
// @route   GET /api/teacher/first-period-class-today
// @access  Private (Teacher)
exports.getFirstPeriodClassToday = async (req, res) => {
    const teacherId = req.userInfo.id;
    const day = getDayOfWeek();
    const queryField = `schedule.${day}`;

    try {
        const scheduleDoc = await Schedule.findOne({
            [queryField]: { $elemMatch: { period: 1, teacher: teacherId } }
        }).populate('classId', 'name');

        if (scheduleDoc) {
            res.json({ class: { classId: scheduleDoc.classId._id, className: scheduleDoc.classId.name } });
        } else {
            res.json({ class: null });
        }
    } catch (error) {
        console.error("Error in getFirstPeriodClassToday:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a teacher's processed weekly schedule.
// @route   GET /api/teacher/my-schedule
// @access  Private (Teacher)
exports.getMySchedule = async (req, res) => {
    const teacherId = req.userInfo.id;
    try {
        const rawSchedules = await Schedule.find({
            $or: [
                { 'schedule.saturday.teacher': teacherId },
                { 'schedule.sunday.teacher': teacherId },
                { 'schedule.monday.teacher': teacherId },
                { 'schedule.tuesday.teacher': teacherId },
                { 'schedule.wednesday.teacher': teacherId },
                { 'schedule.thursday.teacher': teacherId },
            ]
        }).populate('classId', 'name');

        const processedSchedule = [];
        for (const classSchedule of rawSchedules) {
            if (classSchedule && classSchedule.classId) {
                for (const day of days) {
                    if (classSchedule.schedule?.[day]) {
                        for (const period of classSchedule.schedule[day]) {
                            if (period.teacher && period.teacher.toString() === teacherId) {
                                processedSchedule.push({
                                    day: day, period: period.period, subject: period.subject,
                                    classId: classSchedule.classId._id, className: classSchedule.classId.name,
                                });
                            }
                        }
                    }
                }
            }
        }
        res.json(processedSchedule);
    } catch (error) {
        console.error("Error in getMySchedule:", error);
        res.status(500).json({ message: 'Server Error: Could not retrieve schedule.' });
    }
};

// --- The rest of the controller remains the same ---
exports.getClassStudents = async (req, res) => {
    const { classId } = req.params;
    try {
        const students = await User.find({ role: 'Student' }).select('fullName indexNumber');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAttendanceStatus = async (req, res) => {
    const { classId, date } = req.params;
    try {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const attendance = await Attendance.findOne({
            classId,
            date: { $gte: startOfDay, $lte: endOfDay },
        }).populate('records.studentId', 'fullName indexNumber');
        
        if (attendance) {
            res.json({ taken: true, data: attendance });
        } else {
            res.json({ taken: false, data: null });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.submitAttendance = async (req, res) => {
    const teacherId = req.userInfo.id;
    const { classId, date, records } = req.body;
    try {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const newAttendance = new Attendance({ date: startOfDay, classId, teacherId, records });
        await newAttendance.save();
        res.status(201).json({ message: 'Attendance submitted successfully.' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Attendance for this class has already been taken today.' });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};