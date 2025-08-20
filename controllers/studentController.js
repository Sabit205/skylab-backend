const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const Performance = require('../models/Performance');
const DailyPlanner = require('../models/DailyPlanner');

exports.recallPlanner = async (req, res) => {
    const studentId = req.userInfo.id;
    const { plannerId } = req.params;
    try {
        const planner = await DailyPlanner.findById(plannerId);
        if (!planner) {
            return res.status(404).json({ message: 'Planner not found.' });
        }
        if (planner.student.toString() !== studentId) {
            return res.status(403).json({ message: 'You are not authorized to recall this planner.' });
        }
        if (planner.status !== 'Pending') {
            return res.status(400).json({ message: 'This planner cannot be recalled as it has already been reviewed by a guardian.' });
        }
        
        // Deleting is a clean way to handle a recall, allowing a fresh start.
        await DailyPlanner.findByIdAndDelete(plannerId);
        res.json({ message: 'Planner recalled successfully. You can now create a new one for this date.' });
    } catch (error) {
        res.status(500).json({ message: 'Error recalling planner', error: error.message });
    }
};

exports.submitDailyPlanner = async (req, res) => {
    const studentId = req.userInfo.id;
    const { date, ...plannerData } = req.body;
    try {
        const student = await User.findById(studentId);
        if (!student || !student.class) return res.status(404).json({ message: 'Student class not found.' });

        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const existingPlanner = await DailyPlanner.findOne({ student: studentId, date: startOfDay });

        if (existingPlanner && !['Pending', 'TeacherDeclined'].includes(existingPlanner.status)) {
            return res.status(403).json({ message: 'This planner is locked and cannot be edited.' });
        }

        const planner = await DailyPlanner.findOneAndUpdate(
            { student: studentId, date: startOfDay },
            { student: studentId, class: student.class, date: startOfDay, ...plannerData, status: 'Pending' },
            { upsert: true, new: true, runValidators: true }
        );
        res.status(201).json(planner);
    } catch (error) {
        res.status(500).json({ message: 'Error submitting planner', error: error.message });
    }
};

exports.getDailyPlanner = async (req, res) => {
    const studentId = req.userInfo.id;
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ message: "Date is required." });
    }
    try {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const planner = await DailyPlanner.findOne({ student: studentId, date: startOfDay });
        res.json(planner);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching planner' });
    }
};

exports.getDailyPlannerHistory = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const history = await DailyPlanner.find({ student: studentId }).sort({ date: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching planner history' });
    }
};

exports.getDashboardData = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const student = await User.findById(studentId).populate('class', 'name');
        if (!student || !student.class) {
            return res.status(404).json({ message: 'Student or class not found.' });
        }
        const attendanceRecords = await Attendance.find({ 'records.studentId': studentId });
        let present = 0;
        let total = attendanceRecords.length;
        if (total > 0) {
            attendanceRecords.forEach(record => {
                const studentRecord = record.records.find(r => r.studentId.toString() === studentId);
                if (studentRecord && (studentRecord.status === 'Present' || studentRecord.status === 'Late')) {
                    present++;
                }
            });
        }
        const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 100;
        const latestResult = await Result.findOne({ student: studentId }).sort({ createdAt: -1 });
        res.json({
            currentClass: student.class.name,
            attendancePercentage,
            latestResult,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error getting dashboard data' });
    }
};

exports.getMySchedule = async (req, res) => {
    const studentId = req.userInfo.id;
    const { weekStartDate } = req.query;

    if (!weekStartDate) {
        return res.status(400).json({ message: 'Week Start Date is required.' });
    }
    try {
        const student = await User.findById(studentId);
        if (!student || !student.class) {
            return res.status(404).json({ message: 'You are not assigned to a class.' });
        }
        
        const startOfWeek = new Date(weekStartDate);
        startOfWeek.setUTCHours(0, 0, 0, 0);

        const schedule = await Schedule.findOne({ classId: student.class, weekStartDate: startOfWeek })
            .populate('schedule.saturday.teacher', 'fullName').populate('schedule.sunday.teacher', 'fullName')
            .populate('schedule.monday.teacher', 'fullName').populate('schedule.tuesday.teacher', 'fullName')
            .populate('schedule.wednesday.teacher', 'fullName').populate('schedule.thursday.teacher', 'fullName')
            .populate('schedule.saturday.subject', 'name').populate('schedule.sunday.subject', 'name')
            .populate('schedule.monday.subject', 'name').populate('schedule.tuesday.subject', 'name')
            .populate('schedule.wednesday.subject', 'name').populate('schedule.thursday.subject', 'name');
            
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: 'Server Error getting schedule' });
    }
};

exports.getMyAttendance = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const attendance = await Attendance.find({ 'records.studentId': studentId }).sort({ date: -1 });
        const studentHistory = attendance.map(att => {
            const myRecord = att.records.find(r => r.studentId.toString() === studentId);
            return {
                date: att.date,
                status: myRecord ? myRecord.status : 'N/A',
                _id: att._id,
            };
        });
        res.json(studentHistory);
    } catch (error) {
        res.status(500).json({ message: 'Server Error getting attendance' });
    }
};

exports.getMyResults = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const results = await Result.find({ student: studentId }).populate('class', 'name');
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server Error getting results' });
    }
};

exports.getMyFees = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const fees = await Fee.find({ student: studentId })
            .populate('collectedBy', 'fullName')
            .sort({ createdAt: -1 });
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: 'Server Error getting fees' });
    }
};

exports.getMyProfile = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const profile = await User.findById(studentId).populate('class', 'name').select('-password');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Server Error getting profile' });
    }
};

exports.updateMyProfile = async (req, res) => {
    const studentId = req.userInfo.id;
    const { phone, profilePictureUrl } = req.body;
    try {
        const updatedProfile = await User.findByIdAndUpdate(
            studentId, 
            { phone, profilePictureUrl }, 
            { new: true, runValidators: true }
        ).select('-password');
        res.json(updatedProfile);
    } catch (error) {
        res.status(500).json({ message: 'Server Error updating profile' });
    }
};

exports.getMyPerformance = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const history = await Performance.find({ student: studentId })
            .populate('teacher', 'fullName')
            .populate('class', 'name')
            .populate('subject', 'name')
            .sort({ date: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching performance history' });
    }
};