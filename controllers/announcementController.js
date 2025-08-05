const Announcement = require('../models/Announcement');

exports.createAnnouncement = async (req, res) => {
    try {
        // Now correctly uses req.userInfo.id from our fixed middleware
        const newAnnouncement = new Announcement({ ...req.body, author: req.userInfo.id });
        await newAnnouncement.save();
        res.status(201).json(newAnnouncement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const userRole = req.roles[0];
        let query = {};
        if (userRole === 'Student' || userRole === 'Teacher') {
            query = { targetRole: { $in: [userRole, 'All'] } };
        }
        const announcements = await Announcement.find(query).populate('author', 'fullName').sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const deleted = await Announcement.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Announcement not found' });
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};