const { body } = require('express-validator');

const addRules = [
  body('newsId').notEmpty().isMongoId().withMessage('Valid newsId is required'),
  body('text').notEmpty().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1–500 characters').trim(),
];

module.exports = { addRules };
