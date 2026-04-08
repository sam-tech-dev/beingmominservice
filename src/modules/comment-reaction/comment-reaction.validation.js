const { body, query } = require('express-validator');
const { REACTION_TYPES } = require('../reaction/reaction.model');

const toggleRules = [
  body('commentId').notEmpty().isMongoId().withMessage('Valid commentId is required'),
  body('type').isIn(REACTION_TYPES).withMessage(`type must be one of: ${REACTION_TYPES.join(', ')}`),
];

const listRules = [
  query('commentId').notEmpty().isMongoId().withMessage('Valid commentId is required'),
  query('type').optional().isIn(REACTION_TYPES).withMessage(`type must be one of: ${REACTION_TYPES.join(', ')}`),
];

module.exports = { toggleRules, listRules };
