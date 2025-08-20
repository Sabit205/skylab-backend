const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { verifyJWT, verifyRoles } = require('../middleware/verifyJWT');

// Public route to get all subjects (useful for schedules)
router.get('/', subjectController.getAllSubjects);

// Admin-only routes for CUD operations
router.use(verifyJWT, verifyRoles('Admin'));
router.post('/', subjectController.createSubject);
router.put('/:id', subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

module.exports = router;