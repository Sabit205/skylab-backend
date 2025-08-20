const express = require('express');
const router = express.Router();
const guardianController = require('../controllers/guardianController');
const verifyGuardianJWT = require('../middleware/verifyGuardianJWT');

router.post('/login', guardianController.login);
router.post('/refresh', guardianController.refresh);

router.use(verifyGuardianJWT);

router.get('/announcements', guardianController.getAnnouncements);
router.get('/dashboard', guardianController.getDashboardData);
router.get('/my-schedule', guardianController.getMySchedule);
router.get('/my-attendance', guardianController.getMyAttendance);
router.get('/my-results', guardianController.getMyResults);
router.get('/my-fees', guardianController.getMyFees);
router.get('/my-performance', guardianController.getMyPerformance);
router.get('/pending-planners', guardianController.getPendingPlanners);
router.patch('/approve-planner/:plannerId', guardianController.approvePlanner);
router.get('/planner-details/:plannerId', guardianController.getPlannerForApproval); // NEW ROUTE

module.exports = router;