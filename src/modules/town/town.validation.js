const { body } = require('express-validator');

const addTownRules = [
  body('name').trim().notEmpty().withMessage('Town name is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode')
    .trim()
    .notEmpty()
    .withMessage('Pincode is required')
    .matches(/^\d{5,10}$/)
    .withMessage('Enter a valid pincode'),
  body('post').optional().trim(),
  body('block').optional().trim(),
];

module.exports = { addTownRules };
