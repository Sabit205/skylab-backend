const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Attendance = require('../models/Attendance');

// Define the school week days here for consistency across functions
const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

/**
 * @desc    Get a teacher's processed weekly schedule.
 *          This single, robust function powers both the "My Schedule" page and the "Attendance" eligibility check.
 * @route   GET /api/teacher/my-schedule
 * @access  Private (Teacher)
 */
exports.getMySchedule = async (req, res) => {
    const teacherId = req.userInfo.id; // From verifyJWT middleware

    try {
        // Find all schedule documents where the teacher is assigned on any of the school days.
        const rawSchedules = await Schedule.find({
            $or: [
                { 'schedule.saturday.teacher': teacherId },
                { 'schedule.sunday.teacher': teacherId },
                { 'schedule.monday.teacher': teacherId },
                { 'schedule.tuesday.teacher': teacherId },
                { 'schedule.wednesday.teacher': teacherId },
                { 'schedule.thursday.teacher': teacherId },
            ]
        }).populate('classId', 'name'); // Populate the class name for display

        // Process the raw database documents into a simple, flat array for the frontend.
        // This makes the frontend logic much cleaner and less error-prone.
        const processedSchedule = [];

        for (const classSchedule of rawSchedules) {
            // Safety check to ensure the class document exists
            if (classSchedule && classSchedule.classId) {
                for (const day of days) {
                    if (classSchedule.schedule?.[day]) {
                        for (const period of classSchedule.schedule[day]) {
                            // Check if the period has a teacher assigned and if it matches the current user
                            if (period.teacher && period.teacher.toString() === teacherId) {
                                processedSchedule.push({
                                    day: day,
                                    period: period.period,
                                    subject: period.subject,
                                    classId: classSchedule.classId._id,
                                    className: classSchedule.classId.name,
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // Send the clean, easy-to-use array to the frontend
        res.json(processedSchedule);

    } catch (error) {
        console.error("Error in getMySchedule:", error);
        res.status(500).json({ message: 'Server Error: Could not retrieve schedule.' });
    }
};

/**
 * @desc    Get students of a specific class.
 *          Note: This is a simplified implementation. A production app would have a proper
 *          student enrollment collection linking students to classes.
 * @route   GET /api/teacher/class-students/:classId
 * @access  Private (Teacher)
 */
exports.getClassStudents = async (req, res) => {
    const { classId } = req.params;
    try {
        // For this project, we assume all students could be in any class.
        const students = await User.find({ role: 'Student' }).select('fullName indexNumber');
        res.json(students);
    } catch (error) {
        console.error("Error in getClassStudents:", error);
        res.status(500).json({ message: 'Server Error: Could not retrieve students.' });
    }
};

/**
 * @desc    Check if attendance for a class on a specific date has already been taken.
 * @route   GET /api/teacher/attendance-status/:classId/:date
 * @access  Private (Teacher)
 */
exports.getAttendanceStatus = async (req, res) => {
    const { classId, date } = req.params;
    try {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0); // Use UTC hours for consistency

        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const attendance = await Attendance.findOne({
            classId,
            date: { $gte: startOfDay, $lte: endOfDay },
        }).populate('records.studentId', 'fullName indexNumber'); // Populate student details for the history view
        
        if (attendance) {
            res.json({ taken: true, data: attendance });
        } else {
            res.json({ taken: false, data: null });
        }
    } catch (error) {
        console.error("Error in getAttendanceStatus:", error);
        res.status(500).json({ message: 'Server Error: Could not check attendance status.' });
    }
};

/**
 * @desc    Submit new attendance records for a class.
 * @route   POST /api/teacher/attendance
 * @access  Private (Teacher)
 */
exports.submitAttendance = async (req, res) => {
    const teacherId = req.userInfo.id;
    const { classId, date, records } = req.body;
    try {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0); // Store date at the beginning of the day in UTC

        const newAttendance = new Attendance({
            date: startOfDay,
            classId,
            teacherId,
            records,
        });
        
        await newAttendance.save();
        res.status(201).json({ message: 'Attendance submitted successfully.' });
    } catch (error) {
        // Handle the unique index violation error (attendance already taken)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Attendance for this class has already been taken today.' });
        }
        console.error("Error in submitAttendance:", error);
        res.status(500).json({ message: 'Server Error: Could not submit attendance.', error: error.message });
    }
};