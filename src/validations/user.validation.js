const Joi = require('joi');

const registerSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(6)
        .max(30)
        .required()
        .messages({
            'string.empty': 'Username must not be empty',
            'string.alphanum': 'Username can only contain letters and numbers',
            'string.min': 'Username must be at least 6 characters long',
            'string.max': 'Username must be at most 30 characters long',
            'any.required': 'Username is required'
        }),

    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.empty': 'Password must not be empty',
            'string.min': 'Password must be at least 6 characters long',
            'any.required': 'Password is required'
        }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Email must not be empty',
            'string.email': 'Invalid email format',
            'any.required': 'Email is required'
        }),
});

const loginSchema = Joi.object({
    identifier: Joi.string()
        .required()
        .messages({
            'string.empty': 'Username/email must not be empty',
            'any.required': 'Username/email is required',
        }),
    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Password must not be empty',
            'any.required': 'Password is required',
        }),
});

const updateUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(6)
    .max(30)
    .optional()
    .messages({
      'string.alphanum': 'Username can only contain letters and numbers',
      'string.min': 'Username must be at least 6 characters long',
      'string.max': 'Username must be at most 30 characters long',
    }),

  password: Joi.string()
    .min(6)
    .optional()
    .allow('', null)
    .messages({
      'string.min': 'Password must be at least 6 characters long',
    }),

  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Email must be a valid email address',
    }),

  description: Joi.string()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'The maximum length of the description is 500 characters.',
    }),

});


module.exports = {
    registerSchema,
    updateUserSchema,
    loginSchema,
};
