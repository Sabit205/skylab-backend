const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

// Allow admins to get all users, but also allow general fetching for things like teacher lists
router.get('/', verifyJWT, userController.getAllUsers);

// Admin-only routes for CUD
router.use(verifyJWT, verifyRoles('Admin'));

router.post('/', userController.createUser);
router.patch('/:id/status', userController.updateUserStatus);
router.route('/:id')
    .put(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;