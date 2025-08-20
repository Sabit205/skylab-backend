const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

router.use(verifyJWT, verifyRoles('Student'));

router.get('/dashboard', studentController.getDashboardData);
router.get('/my-schedule', studentController.getMySchedule);
router.get('/my-attendance', studentController.getMyAttendance);
router.get('/my-results', studentController.getMyResults);
router.get('/my-fees', studentController.getMyFees);
router.get('/my-profile', studentController.getMyProfile);
router.put('/my-profile', studentController.updateMyProfile);
router.get('/my-performance', studentController.getMyPerformance);
router.post('/daily-planner', studentController.submitDailyPlanner);
router.get('/daily-planner', studentController.getDailyPlanner);
router.get('/daily-planner-history', studentController.getDailyPlannerHistory);
router.patch('/daily-planner/:plannerId/recall', studentController.recallPlanner); // NEW ROUTE

module.exports = router;