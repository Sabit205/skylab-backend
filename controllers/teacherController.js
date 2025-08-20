const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
const DailyPlanner = require('../models/DailyPlanner');

const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const diff = dayOfWeek < 6 ? dayOfWeek + 1 : 0;
    d.setDate(d.getDate() - diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

exports.getPlannerForReview = async (req, res) => {
    const { plannerId } = req.params;
    try {
        const planner = await DailyPlanner.findById(plannerId)
            .populate('student', 'fullName indexNumber')
            .populate('class', 'name');
        if (!planner) return res.status(404).json({ message: 'Planner not found.' });

        // Security Check: Ensure the teacher is the class teacher for this student's planner
        const studentClass = await require('../models/Class').findById(planner.class._id);
        if (!studentClass || studentClass.teacher.toString() !== req.userInfo.id) {
            return res.status(403).json({ message: 'Forbidden: You are not the class teacher for this student.' });
        }

        res.json(planner);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching planner details.' });
    }
};

exports.getGuardianApprovedPlanners = async (req, res) => {
    const teacherId = req.userInfo.id;
    try {
        const taughtClasses = await require('../models/Class').find({ teacher: teacherId });
        const classIds = taughtClasses.map(c => c._id);
        
        const planners = await DailyPlanner.find({
            class: { $in: classIds },
            status: 'GuardianApproved'
        }).populate('student', 'fullName indexNumber').sort({ date: -1 });

        res.json(planners);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching planners' });
    }
};

exports.reviewPlanner = async (req, res) => {
    const { plannerId } = req.params;
    const { status, teacherDeclineComment } = req.body;

    if (!['TeacherApproved', 'TeacherDeclined'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    if (status === 'TeacherDeclined' && !teacherDeclineComment) {
        return res.status(400).json({ message: 'Comment is required for declining.' });
    }

    try {
        const planner = await DailyPlanner.findById(plannerId);
        if (!planner) return res.status(404).json({ message: 'Planner not found' });
        
        const studentClass = await require('../models/Class').findById(planner.class);
        if (!studentClass || studentClass.teacher.toString() !== req.userInfo.id) {
            return res.status(403).json({ message: 'Forbidden: You are not the class teacher for this student.' });
        }
        
        planner.status = status;
        if (status === 'TeacherDeclined') {
            planner.teacherDeclineComment = teacherDeclineComment;
        } else {
            planner.teacherDeclineComment = undefined;
        }
        await planner.save();
        res.json(planner);
    } catch (error) {
        res.status(500).json({ message: 'Error reviewing planner' });
    }
};

exports.getTodaysClasses = async (req, res) => {
    const teacherId = req.userInfo.id;
    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today).toLowerCase();

    try {
        const rawSchedules = await Schedule.find({
            weekStartDate: startOfWeek,
            [`schedule.${dayOfWeek}.teacher`]: teacherId
        }).populate('classId', 'name').populate(`schedule.${dayOfWeek}.subject`, 'name');

        const todaysClasses = [];
        rawSchedules.forEach(classSchedule => {
            if (classSchedule.schedule?.[dayOfWeek]) {
                classSchedule.schedule[dayOfWeek].forEach(period => {
                    if (period.teacher && period.teacher.toString() === teacherId && period.subject) {
                        todaysClasses.push({
                            period: period.period, startTime: period.startTime, endTime: period.endTime,
                            subject: period.subject, classId: classSchedule.classId._id, className: classSchedule.classId.name,
                        });
                    }
                });
            }
        });
        
        todaysClasses.sort((a, b) => a.period - b.period);
        res.json(todaysClasses);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMySchedule = async (req, res) => {
    const teacherId = req.userInfo.id;
    const { weekStartDate } = req.query;
    if (!weekStartDate) {
        return res.status(400).json({ message: 'Week Start Date is required.' });
    }
    
    const startOfWeek = new Date(weekStartDate);
    startOfWeek.setUTCHours(0, 0, 0, 0);
    try {
        const rawSchedules = await Schedule.find({
            weekStartDate: startOfWeek,
            $or: [
                { 'schedule.saturday.teacher': teacherId }, { 'schedule.sunday.teacher': teacherId },
                { 'schedule.monday.teacher': teacherId }, { 'schedule.tuesday.teacher': teacherId },
                { 'schedule.wednesday.teacher': teacherId }, { 'schedule.thursday.teacher': teacherId },
            ]
        }).populate('classId', 'name').populate('schedule.saturday.subject', 'name').populate('schedule.sunday.subject', 'name').populate('schedule.monday.subject', 'name').populate('schedule.tuesday.subject', 'name').populate('schedule.wednesday.subject', 'name').populate('schedule.thursday.subject', 'name');

        const fullSchedule = {};
        
        rawSchedules.forEach(classSchedule => {
            if (classSchedule && classSchedule.classId) {
                days.forEach(day => {
                    if (!fullSchedule[day]) fullSchedule[day] = [];
                    if (classSchedule.schedule?.[day]) {
                        classSchedule.schedule[day].forEach(period => {
                            if (period.teacher && period.teacher.toString() === teacherId) {
                                fullSchedule[day].push({
                                    period: period.period, startTime: period.startTime, endTime: period.endTime,
                                    subject: period.subject, classId: classSchedule.classId._id, className: classSchedule.classId.name,
                                });
                            }
                        });
                    }
                });
            }
        });

        for (const day in fullSchedule) {
            fullSchedule[day].sort((a, b) => a.period - b.period);
        }

        res.json({ schedule: fullSchedule });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not retrieve schedule.' });
    }
};

exports.getFirstPeriodClassToday = async (req, res) => {
    const teacherId = req.userInfo.id;
    const getDayOfWeek = () => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toLowerCase();
    const day = getDayOfWeek();
    const startOfWeek = getStartOfWeek(new Date());
    const queryField = `schedule.${day}`;
    try {
        const scheduleDoc = await Schedule.findOne({
            weekStartDate: startOfWeek,
            [queryField]: { $elemMatch: { period: 1, teacher: teacherId } }
        }).populate('classId', 'name');
        
        if (scheduleDoc) {
            res.json({ class: { classId: scheduleDoc.classId._id, className: scheduleDoc.classId.name } });
        } else {
            res.json({ class: null });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.submitPerformance = async (req, res) => {
    const teacherId = req.userInfo.id;
    const { studentId, classId, subjectId, rating, comment, date } = req.body;
    try {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        await Performance.findOneAndUpdate(
            { student: studentId, teacher: teacherId, subject: subjectId, date: startOfDay, class: classId },
            { rating, comment },
            { upsert: true, new: true, runValidators: true }
        );
        res.status(201).json({ message: 'Performance submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting performance' });
    }
};

exports.getPerformanceHistory = async (req, res) => {
    const teacherId = req.userInfo.id;
    try {
        const history = await Performance.find({ teacher: teacherId })
            .populate('student', 'fullName indexNumber')
            .populate('class', 'name')
            .populate('subject', 'name')
            .sort({ date: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching performance history' });
    }
};

exports.getClassStudents = async (req, res) => {
    const { classId } = req.params;
    try {
        const students = await User.find({ role: 'Student', class: classId }).select('fullName indexNumber');
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
        res.status(201).json({ message: 'Attendance submitted successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Attendance for this class has already been taken today.' });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};