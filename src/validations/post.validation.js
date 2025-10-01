const Joi = require('joi');

const createPostSchema = Joi.object({
  content: Joi.string().trim().min(5).required().messages({
    'string.empty': 'Content must not be empty.',
    'string.min': 'Content must be at least 5 character long.',
    'any.required': 'Content is required.'
  }),

  privacy: Joi.string().valid('friend', 'public').required().messages({
    'any.only': 'Privacy must be either "friend" or "public".',
    'any.required': 'Privacy setting is required.'
  }),
  location: Joi.string().required(),
  locationName: Joi.string().optional(),
  address: Joi.string().optional(),
  type: Joi.string().optional(),
  category: Joi.string().optional(),
  images: Joi.string().optional(),
  maxParticipants: Joi.number().empty('').optional(),
});

const updatePostSchema = Joi.object({
  content: Joi.string().messages({
    'string.base': 'Content must be a string',
  }),

  privacy: Joi.string().valid('public', 'friend').messages({
    'any.only': "Privacy must be either 'public' or 'friend'",
    'string.base': 'Privacy must be a string',
  }),

  location: Joi.string().allow('', null).optional(),
  locationName: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  type: Joi.string().allow('', null).optional(),
  category: Joi.string().allow('', null).optional(),
  oldImages: Joi.string().allow('', null).optional(),
  images: Joi.string().allow('', null).optional(),
  maxParticipants: Joi.number().empty('').optional(),
});


module.exports = {
  createPostSchema,
  updatePostSchema,
};