const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../validation/schemas');

// Apply validation middleware before the controller logic
router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);

router.get('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;