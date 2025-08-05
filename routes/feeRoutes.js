const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

router.use(verifyJWT, verifyRoles('Admin'));

router.get('/student-lookup/:indexNumber', feeController.lookupStudent);
router.post('/', feeController.collectFee);
router.get('/history', feeController.getFeeHistory);

module.exports = router;