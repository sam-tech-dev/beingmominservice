const express = require('express');
const { body } = require('express-validator');
const { toggle } = require('./reaction.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const { REACTION_TYPES } = require('./reaction.model');

const router = express.Router();

const toggleRules = [
  body('newsId').notEmpty().isMongoId().withMessage('Valid newsId is required'),
  body('type').isIn(REACTION_TYPES).withMessage(`type must be one of: ${REACTION_TYPES.join(', ')}`),
];

router.post('/toggle', authenticate, requireRole('user'), toggleRules, toggle);

module.exports = router;
