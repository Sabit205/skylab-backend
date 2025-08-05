const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

router.use(verifyJWT, verifyRoles('Admin'));

router.route('/')
    .post(classController.createClass)
    .get(classController.getAllClasses);

router.route('/:id')
    .delete(classController.deleteClass);

module.exports = router;