const Joi = require('joi');

const commentSchema = Joi.object({
    content: Joi.string()
        .trim()
        .min(1)
        .max(5000)
        .required()
        .messages({
            'string.empty': 'Content is required.',
            'string.min': 'Content must not be empty.',
            'string.max': 'Content must not exceed 5000 characters.',
            'any.required': 'Content is required.',
        })
});

module.exports = {
    commentSchema,
};