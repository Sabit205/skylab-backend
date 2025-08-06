const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

// --- THE DEFINITIVE FIX ---

// PUBLIC ROUTE: GET /classes
// This route is defined *before* any authentication middleware is applied.
// This allows the public signup page to fetch the list of classes without needing to be logged in.
router.get('/', classController.getAllClasses);


// PROTECTED ROUTES:
// Apply the authentication and authorization middleware only to the routes below this line.
// This ensures that only authenticated Admins can create or delete classes.
router.use(verifyJWT, verifyRoles('Admin'));

// POST /classes
router.post('/', classController.createClass);

// DELETE /classes/:id
router.delete('/:id', classController.deleteClass);


module.exports = router;