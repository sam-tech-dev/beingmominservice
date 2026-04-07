const express = require('express');
const { add, list, remove } = require('./comment.controller');
const { addRules } = require('./comment.validation');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.post('/', authenticate, requireRole('user'), addRules, add);
router.get('/:newsId', authenticate, list);
router.delete('/:commentId', authenticate, requireRole('user'), remove);

module.exports = router;
