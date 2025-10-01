const Joi = require('joi');

const emailResetPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Email must not be empty',
            'string.email': 'Invalid email format',
            'any.required': 'Email is required',
        }),
});

const verificationCodeSchema = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string()
        .length(6)
        .required()
        .messages({
            'string.empty': 'Verification code is required.',
            'string.length': 'Verification code must be exactly 6 characters.',
        }),
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string()
        .length(6)
        .required(),
    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.empty': 'Password must not be empty',
            'string.min': 'Password must be at least 6 characters long',
            'any.required': 'Password is required',
        }),
});

module.exports = {
    emailResetPasswordSchema,
    verificationCodeSchema,
    resetPasswordSchema,
};