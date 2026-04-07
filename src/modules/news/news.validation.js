const { body } = require('express-validator');

const publishRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('body').trim().notEmpty().withMessage('Body is required'),
];

module.exports = { publishRules };
