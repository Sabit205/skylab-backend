const Schedule = require('../models/Schedule');

// This function's logic is correct and does not need to change.
exports.getSchedule = async (req, res) => {
    const { classId, weekStartDate } = req.query;
    if (!classId || !weekStartDate) {
        return res.status(400).json({ message: 'Class ID and Week Start Date are required.' });
    }
    try {
        const startOfWeek = new Date(weekStartDate);
        startOfWeek.setUTCHours(0, 0, 0, 0);

        let schedule = await Schedule.findOne({ classId, weekStartDate: startOfWeek })
            .populate('schedule.saturday.teacher', 'fullName').populate('schedule.sunday.teacher', 'fullName')
            .populate('schedule.monday.teacher', 'fullName').populate('schedule.tuesday.teacher', 'fullName')
            .populate('schedule.wednesday.teacher', 'fullName').populate('schedule.thursday.teacher', 'fullName')
            .populate('schedule.saturday.subject', 'name code').populate('schedule.sunday.subject', 'name code')
            .populate('schedule.monday.subject', 'name code').populate('schedule.tuesday.subject', 'name code')
            .populate('schedule.wednesday.subject', 'name code').populate('schedule.thursday.subject', 'name code');
            
        if (!schedule) {
            const defaultPeriods = Array(8).fill(null).map((_, i) => ({
                period: i + 1, startTime: '', endTime: '', subject: null, teacher: null
            }));
            const newScheduleData = {
                classId,
                weekStartDate: startOfWeek,
                schedule: {
                    saturday: [...defaultPeriods], sunday: [...defaultPeriods], monday: [...defaultPeriods],
                    tuesday: [...defaultPeriods], wednesday: [...defaultPeriods], thursday: [...defaultPeriods],
                }
            };
            return res.json(newScheduleData);
        }
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schedule', error: error.message });
    }
};

// --- THIS UPDATE LOGIC IS NOW MORE ROBUST AND EXPLICIT ---
exports.updateSchedule = async (req, res) => {
    const { classId, weekStartDate, schedule: incomingSchedule } = req.body;

    if (!classId || !weekStartDate || !incomingSchedule) {
        return res.status(400).json({ message: 'Class ID, Week Start Date, and Schedule object are required.' });
    }
    
    try {
        const startOfWeek = new Date(weekStartDate);
        startOfWeek.setUTCHours(0, 0, 0, 0);

        // Find if a schedule for this class and week already exists.
        let existingSchedule = await Schedule.findOne({ classId, weekStartDate: startOfWeek });

        // Sanitize the incoming schedule data.
        const sanitizedSchedule = {};
        const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
        days.forEach(day => {
            if (incomingSchedule && incomingSchedule[day]) {
                sanitizedSchedule[day] = incomingSchedule[day].map(period => ({
                    period: period.period,
                    startTime: period.startTime || '',
                    endTime: period.endTime || '',
                    subject: period.subject || null,
                    teacher: period.teacher || null,
                }));
            }
        });

        if (existingSchedule) {
            // If it exists, update it and save.
            existingSchedule.schedule = sanitizedSchedule;
            await existingSchedule.save();
            res.json(existingSchedule);
        } else {
            // If it does not exist, create a new document.
            const newSchedule = await Schedule.create({
                classId,
                weekStartDate: startOfWeek,
                schedule: sanitizedSchedule,
            });
            res.status(201).json(newSchedule);
        }
    } catch (error) {
        console.error("Error updating schedule:", error);
        // This will now correctly report any other potential duplicate key errors during development
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A schedule for this class and week already exists.' });
        }
        res.status(500).json({ message: 'Error updating schedule', error: error.message });
    }
};