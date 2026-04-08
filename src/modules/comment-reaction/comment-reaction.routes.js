const express = require('express');
const { toggle, listReactors } = require('./comment-reaction.controller');
const { toggleRules, listRules } = require('./comment-reaction.validation');
const { authenticate, requireRole } = require('../../middleware/auth');

const router = express.Router();

router.post('/toggle', authenticate, requireRole('user'), toggleRules, toggle);
router.get('/list', authenticate, listRules, listReactors);

module.exports = router;
