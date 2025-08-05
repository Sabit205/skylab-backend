const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../validation/schemas');

// General route, no validation needed for GET
router.get('/', verifyJWT, userController.getAllUsers);

// Admin-only routes
router.use(verifyJWT, verifyRoles('Admin'));

router.post('/', validate(createUserSchema), userController.createUser);
router.patch('/:id/status', userController.updateUserStatus);
router.route('/:id')
    .put(validate(updateUserSchema), userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;