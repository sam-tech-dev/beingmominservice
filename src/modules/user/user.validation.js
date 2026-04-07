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
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
];

const loginRules = [
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileRules = [
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('townId')
    .optional()
    .isMongoId()
    .withMessage('Invalid town selected'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  body('currentPassword')
    .if(body('newPassword').exists({ checkFalsy: true }))
    .notEmpty()
    .withMessage('Current password is required to set a new password'),
];

module.exports = { signupRules, loginRules, updateProfileRules };
