const Schedule = require('../models/Schedule');

exports.getSchedule = async (req, res) => {
    const { classId } = req.params;
    try {
        let schedule = await Schedule.findOne({ classId })
            .populate('schedule.saturday.teacher', 'fullName')
            .populate('schedule.sunday.teacher', 'fullName')
            .populate('schedule.monday.teacher', 'fullName')
            .populate('schedule.tuesday.teacher', 'fullName')
            .populate('schedule.wednesday.teacher', 'fullName')
            .populate('schedule.thursday.teacher', 'fullName');
            
        if (!schedule) {
            const defaultPeriods = Array(8).fill(null).map((_, i) => ({ period: i + 1, subject: '', teacher: null }));
            const newSchedule = {
                classId,
                schedule: {
                    saturday: [...defaultPeriods],
                    sunday: [...defaultPeriods],
                    monday: [...defaultPeriods],
                    tuesday: [...defaultPeriods],
                    wednesday: [...defaultPeriods],
                    thursday: [...defaultPeriods],
                }
            };
            schedule = await Schedule.create(newSchedule);
        }
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schedule', error: error.message });
    }
};

exports.updateSchedule = async (req, res) => {
    const { classId } = req.params;
    const incomingSchedule = req.body.schedule;

    try {
        const updatePayload = {};
        const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

        days.forEach(day => {
            if (incomingSchedule && incomingSchedule[day]) {
                const daySchedule = incomingSchedule[day].map(period => ({
                    period: period.period,
                    subject: period.subject || '',
                    teacher: period.teacher || null,
                }));
                updatePayload[`schedule.${day}`] = daySchedule;
            }
        });

        const updatedSchedule = await Schedule.findOneAndUpdate(
            { classId },
            { $set: updatePayload },
            { new: true, upsert: true }
        );

        res.json(updatedSchedule);
    } catch (error) {
        console.error("Error updating schedule:", error);
        res.status(500).json({ message: 'Error updating schedule', error: error.message });
    }
};