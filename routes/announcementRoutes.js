const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

// Anyone authenticated can GET announcements, but only Admin can POST/DELETE
router.get('/', verifyJWT, announcementController.getAnnouncements);
router.post('/', verifyJWT, verifyRoles('Admin'), announcementController.createAnnouncement);
router.delete('/:id', verifyJWT, verifyRoles('Admin'), announcementController.deleteAnnouncement);

module.exports = router;