const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

// All routes in this file are protected and require Teacher role
router.use(verifyJWT, verifyRoles('Teacher'));

// This one route now provides all necessary schedule data
router.get('/my-schedule', teacherController.getMySchedule);

// Existing Routes
router.get('/class-students/:classId', teacherController.getClassStudents);
router.get('/attendance-status/:classId/:date', teacherController.getAttendanceStatus);
router.post('/attendance', teacherController.submitAttendance);

module.exports = router;