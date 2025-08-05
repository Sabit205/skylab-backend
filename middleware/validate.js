const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        // If validation fails, send a 400 Bad Request response with the details.
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

module.exports = validate;