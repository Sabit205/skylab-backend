const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Fee = require('../models/Fee');

// @desc    Get data for the student dashboard overview
// @route   GET /api/student/dashboard
// @access  Private (Student)
exports.getDashboardData = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const student = await User.findById(studentId).populate('class', 'name');
        if (!student || !student.class) {
            return res.status(404).json({ message: 'Student or class not found.' });
        }

        // 1. Attendance Percentage
        const attendanceRecords = await Attendance.find({ 'records.studentId': studentId });
        let present = 0;
        let total = attendanceRecords.length;
        if (total > 0) {
            attendanceRecords.forEach(record => {
                const studentRecord = record.records.find(r => r.studentId.toString() === studentId);
                if (studentRecord && studentRecord.status === 'Present') {
                    present++;
                }
            });
        }
        const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 100;

        // 2. Latest Result Summary
        const latestResult = await Result.findOne({ student: studentId }).sort({ createdAt: -1 });

        res.json({
            currentClass: student.class.name,
            attendancePercentage,
            latestResult,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get the student's own class schedule
// @route   GET /api/student/my-schedule
// @access  Private (Student)
exports.getMySchedule = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const student = await User.findById(studentId);
        if (!student || !student.class) {
            return res.status(404).json({ message: 'You are not assigned to a class.' });
        }
        const schedule = await Schedule.findOne({ classId: student.class })
            .populate('schedule.saturday.teacher', 'fullName')
            .populate('schedule.sunday.teacher', 'fullName')
            .populate('schedule.monday.teacher', 'fullName')
            .populate('schedule.tuesday.teacher', 'fullName')
            .populate('schedule.wednesday.teacher', 'fullName')
            .populate('schedule.thursday.teacher', 'fullName');
            
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get the student's own attendance history
// @route   GET /api/student/my-attendance
// @access  Private (Student)
exports.getMyAttendance = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const attendance = await Attendance.find({ 'records.studentId': studentId }).sort({ date: -1 });
        // Filter to return only the specific student's record for each day
        const studentHistory = attendance.map(att => {
            const myRecord = att.records.find(r => r.studentId.toString() === studentId);
            return {
                date: att.date,
                status: myRecord.status,
                _id: att._id,
            };
        });
        res.json(studentHistory);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get the student's own academic results
// @route   GET /api/student/my-results
// @access  Private (Student)
exports.getMyResults = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const results = await Result.find({ student: studentId }).populate('class', 'name');
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get the student's own fee payment history
// @route   GET /api/student/my-fees
// @access  Private (Student)
exports.getMyFees = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const fees = await Fee.find({ student: studentId })
            .populate('collectedBy', 'fullName')
            .sort({ createdAt: -1 });
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get the student's own profile
// @route   GET /api/student/my-profile
// @access  Private (Student)
exports.getMyProfile = async (req, res) => {
    const studentId = req.userInfo.id;
    try {
        const profile = await User.findById(studentId).populate('class', 'name').select('-password');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update the student's own profile
// @route   PUT /api/student/my-profile
// @access  Private (Student)
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
        res.status(500).json({ message: 'Server Error' });
    }
};