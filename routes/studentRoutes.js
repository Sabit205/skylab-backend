const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

// All routes are protected and require the 'Student' role
router.use(verifyJWT, verifyRoles('Student'));

router.get('/dashboard', studentController.getDashboardData);
router.get('/my-schedule', studentController.getMySchedule);
router.get('/my-attendance', studentController.getMyAttendance);
router.get('/my-results', studentController.getMyResults);
router.get('/my-fees', studentController.getMyFees);
router.get('/my-profile', studentController.getMyProfile);
router.put('/my-profile', studentController.updateMyProfile);

module.exports = router;