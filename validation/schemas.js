const Joi = require('joi');

// --- THE DEFINITIVE FIX IS IN THIS SCHEMA ---
const signupSchema = Joi.object({
    fullName: Joi.string().min(3).required(),
    email: Joi.string().email().when('role', { is: Joi.valid('Teacher', 'Admin'), then: Joi.required(), otherwise: Joi.optional() }),
    indexNumber: Joi.string().when('role', { is: 'Student', then: Joi.required(), otherwise: Joi.optional() }),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('Student', 'Teacher').required(), // Admins can't sign up via public form
    
    // This line tells the validator that a 'class' field (must be a string)
    // is REQUIRED when the role is 'Student', but is not allowed otherwise.
    class: Joi.string().when('role', { is: 'Student', then: Joi.required(), otherwise: Joi.forbidden() }),
});

const loginSchema = Joi.object({
    identifier: Joi.string().required(),
    password: Joi.string().required(),
    role: Joi.string().valid('Student', 'Teacher', 'Admin').required(),
});

const createUserSchema = Joi.object({
    fullName: Joi.string().min(3).required(),
    email: Joi.string().email().when('role', { is: Joi.valid('Teacher', 'Admin'), then: Joi.required() }),
    indexNumber: Joi.string().when('role', { is: 'Student', then: Joi.required() }),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('Student', 'Teacher', 'Admin').required(),
    class: Joi.string().when('role', { is: 'Student', then: Joi.required() }),
});

const updateUserSchema = Joi.object({
    fullName: Joi.string().min(3),
    email: Joi.string().email(),
    indexNumber: Joi.string(),
    role: Joi.string().valid('Student', 'Teacher', 'Admin'),
    class: Joi.string(),
    phone: Joi.string().allow('').optional(),
    profilePictureUrl: Joi.string().allow('').optional(),
});


module.exports = {
    signupSchema,
    loginSchema,
    createUserSchema,
    updateUserSchema,
};