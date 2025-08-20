const User = require('../models/User');
const jwt = require('jsonwebtoken');
const DailyPlanner = require('../models/DailyPlanner');
const studentController = require('./studentController');

exports.getPlannerForApproval = async (req, res) => {
    const { plannerId } = req.params;
    const studentId = req.studentId;
    try {
        const planner = await DailyPlanner.findById(plannerId)
            .populate('student', 'fullName indexNumber')
            .populate('class', 'name');
        
        if (!planner || planner.student._id.toString() !== studentId) {
            return res.status(404).json({ message: 'Planner not found or access denied.' });
        }
        res.json(planner);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching planner details.' });
    }
};

exports.getPendingPlanners = async (req, res) => {
    const studentId = req.studentId;
    try {
        const planners = await DailyPlanner.find({ student: studentId, status: 'Pending' }).sort({ date: -1 });
        res.json(planners);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending planners' });
    }
};

exports.approvePlanner = async (req, res) => {
    const { plannerId } = req.params;
    const { signature } = req.body;
    try {
        const planner = await DailyPlanner.findById(plannerId);
        if (!planner) return res.status(404).json({ message: 'Planner not found' });
        
        if (planner.student.toString() !== req.studentId) {
            return res.status(403).json({ message: 'Forbidden: You cannot approve this planner.' });
        }

        planner.status = 'GuardianApproved';
        planner.guardianSignature = signature;
        await planner.save();
        res.json(planner);
    } catch (error) {
        res.status(500).json({ message: 'Error approving planner' });
    }
};

exports.login = async (req, res) => {
    const { indexNumber, accessCode } = req.body;
    if (!indexNumber || !accessCode) {
        return res.status(400).json({ message: 'Index number and access code are required.' });
    }
    try {
        const student = await User.findOne({ indexNumber, role: 'Student' });
        if (!student || student.guardianAccessCode !== accessCode) {
            return res.status(401).json({ message: 'Invalid index number or access code.' });
        }
        
        const accessToken = jwt.sign(
            { "GuardianInfo": { "studentId": student._id, "studentName": student.fullName } },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '8h' }
        );
        
        res.json({
            accessToken,
            user: { studentId: student._id, studentName: student.fullName }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
};

exports.refresh = async (req, res) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        async (err, decoded) => {
            if (err && err.name !== 'TokenExpiredError') return res.status(403).json({ message: 'Forbidden' });
            if (!decoded || !decoded.GuardianInfo) return res.status(403).json({ message: 'Forbidden: Invalid token payload' });

            const student = await User.findById(decoded.GuardianInfo.studentId);
            if (!student) return res.status(401).json({ message: 'Student not found' });

            const newAccessToken = jwt.sign(
                { "GuardianInfo": { "studentId": student._id, "studentName": student.fullName } },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '8h' }
            );

            res.json({
                accessToken: newAccessToken,
                user: { studentId: student._id, studentName: student.fullName }
            });
        }
    );
};

exports.getAnnouncements = async (req, res) => {
    try {
        const query = { targetRole: { $in: ['Student', 'All'] } };
        const announcements = await require('../models/Announcement').find(query).populate('author', 'fullName').sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching announcements' });
    }
};

exports.getDashboardData = (req, res) => {
    req.userInfo = { id: req.studentId };
    studentController.getDashboardData(req, res);
};
exports.getMySchedule = (req, res) => {
    req.userInfo = { id: req.studentId };
    studentController.getMySchedule(req, res);
};
exports.getMyAttendance = (req, res) => {
    req.userInfo = { id: req.studentId };
    studentController.getMyAttendance(req, res);
};
exports.getMyResults = (req, res) => {
    req.userInfo = { id: req.studentId };
    studentController.getMyResults(req, res);
};
exports.getMyFees = (req, res) => {
    req.userInfo = { id: req.studentId };
    studentController.getMyFees(req, res);
};
exports.getMyPerformance = (req, res) => {
    req.userInfo = { id: req.studentId };
    studentController.getMyPerformance(req, res);
};