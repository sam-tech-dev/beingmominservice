const { body } = require('express-validator');
const { GENDERS, MARITAL_STATUSES, EDUCATION_LEVELS } = require('./person.model');

const addRules = [
  body('name').notEmpty().isLength({ min: 2 }).withMessage('Name must be at least 2 characters').trim(),
  body('gender').isIn(GENDERS).withMessage(`Gender must be one of: ${GENDERS.join(', ')}`),
  body('maritalStatus').isIn(MARITAL_STATUSES).withMessage(`Marital status must be one of: ${MARITAL_STATUSES.join(', ')}`),
  body('townId').if((_, { req }) => req.user?.isAdmin).notEmpty().isMongoId().withMessage('Valid townId is required for admin'),
  body('highestEducation').optional({ nullable: true, checkFalsy: true }).isIn(EDUCATION_LEVELS).withMessage(`Education must be one of: ${EDUCATION_LEVELS.join(', ')}`),
  body('fatherId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid fatherId'),
  body('motherId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid motherId'),
  body('lifePartnerIds').optional({ nullable: true }),
];

const updateRules = [
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters').trim(),
  body('gender').optional().isIn(GENDERS).withMessage(`Gender must be one of: ${GENDERS.join(', ')}`),
  body('maritalStatus').optional().isIn(MARITAL_STATUSES).withMessage(`Marital status must be one of: ${MARITAL_STATUSES.join(', ')}`),
  body('highestEducation').optional({ nullable: true, checkFalsy: true }).isIn(EDUCATION_LEVELS).withMessage(`Education must be one of: ${EDUCATION_LEVELS.join(', ')}`),
  body('fatherId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid fatherId'),
  body('motherId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid motherId'),
  body('lifePartnerIds').optional({ nullable: true }),
];

module.exports = { addRules, updateRules };
