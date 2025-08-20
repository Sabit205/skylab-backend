const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

router.use(verifyJWT, verifyRoles('Teacher'));

router.get('/todays-classes', teacherController.getTodaysClasses);
router.get('/my-schedule', teacherController.getMySchedule);
router.get('/first-period-class-today', teacherController.getFirstPeriodClassToday);
router.get('/class-students/:classId', teacherController.getClassStudents);
router.get('/attendance-status/:classId/:date', teacherController.getAttendanceStatus);
router.post('/attendance', teacherController.submitAttendance);
router.post('/performance', teacherController.submitPerformance);
router.get('/performance-history', teacherController.getPerformanceHistory);
router.get('/guardian-approved-planners', teacherController.getGuardianApprovedPlanners);
router.patch('/review-planner/:plannerId', teacherController.reviewPlanner);
router.get('/planner-details/:plannerId', teacherController.getPlannerForReview); // NEW ROUTE

module.exports = router;