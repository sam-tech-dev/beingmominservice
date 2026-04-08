const express = require('express');
const { body, query } = require('express-validator');
const { toggle, listReactors } = require('./reaction.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const { REACTION_TYPES } = require('./reaction.model');

const router = express.Router();

const toggleRules = [
  body('newsId').notEmpty().isMongoId().withMessage('Valid newsId is required'),
  body('type').isIn(REACTION_TYPES).withMessage(`type must be one of: ${REACTION_TYPES.join(', ')}`),
];

const listRules = [
  query('newsId').notEmpty().isMongoId().withMessage('Valid newsId is required'),
  query('type').optional().isIn(REACTION_TYPES).withMessage(`type must be one of: ${REACTION_TYPES.join(', ')}`),
];

router.post('/toggle', authenticate, requireRole('user'), toggleRules, toggle);
router.get('/list', authenticate, listRules, listReactors);

module.exports = router;
