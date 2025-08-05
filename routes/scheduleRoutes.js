const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

router.use(verifyJWT, verifyRoles('Admin'));

router.route('/:classId')
    .get(scheduleController.getSchedule)
    .put(scheduleController.updateSchedule);

module.exports = router;