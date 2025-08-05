const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

router.use(verifyJWT, verifyRoles('Admin'));

router.route('/')
    .post(financeController.addTransaction)
    .get(financeController.getTransactions);

router.route('/:id')
    .put(financeController.updateTransaction) // <-- ADDED UPDATE ROUTE
    .delete(financeController.deleteTransaction);

module.exports = router;