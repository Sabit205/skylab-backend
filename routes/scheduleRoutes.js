const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

// All routes are protected and require Admin role
router.use(verifyJWT, verifyRoles('Admin'));

// --- THE DEFINITIVE FIX ---
// This route now correctly handles a GET request to /schedules
// and expects the parameters in the query string.
router.get('/', scheduleController.getSchedule);

// The route for updating/creating a schedule
router.put('/', scheduleController.updateSchedule);

module.exports = router;