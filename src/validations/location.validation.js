const Joi = require('joi');

const locationSchema = Joi.object({
    type: Joi.string().valid('Point').required().messages({
        'any.required': '"type" is required.',
        'string.base': '"type" must be a string.',
        'any.only': '"type" must be "Point".'
    }),

    coordinates: Joi.array().items(Joi.number().required().messages({
        'number.base': 'Each item in "coordinates" must be a number.',
        'any.required': 'Coordinates must not be empty.'
    }))
        .length(2)
        .required()
        .messages({
            'array.base': '"coordinates" must be an array.',
            'array.length': '"coordinates" must contain exactly 2 values: [longitude, latitude].',
            'any.required': '"coordinates" is required.'
        })
});

module.exports = {
    locationSchema,
}