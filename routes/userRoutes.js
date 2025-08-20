const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../validation/schemas');

router.get('/', verifyJWT, userController.getAllUsers);

router.use(verifyJWT, verifyRoles('Admin'));

router.post('/', validate(createUserSchema), userController.createUser);

// --- NEW ROUTES FOR GUARDIAN CODE MANAGEMENT ---
router.post('/:id/generate-code', userController.generateGuardianCode);
router.delete('/:id/revoke-code', userController.revokeGuardianCode);

router.patch('/:id/status', userController.updateUserStatus);
router.route('/:id')
    .put(validate(updateUserSchema), userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;