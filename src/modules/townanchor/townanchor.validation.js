const { body } = require('express-validator');

const signupRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('Enter a valid phone number'),
  body('townId')
    .trim()
    .notEmpty()
    .withMessage('Town is required')
    .isMongoId()
    .withMessage('Invalid town selected'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { signupRules, loginRules };
