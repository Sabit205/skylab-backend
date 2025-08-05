const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

router.use(verifyJWT);
router.use(verifyRoles('Admin'));

router.get('/stats', dashboardController.getStats);

module.exports = router;