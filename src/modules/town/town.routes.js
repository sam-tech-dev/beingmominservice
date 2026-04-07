const express = require('express');
const { addTown, listTowns } = require('./town.controller');
const { addTownRules } = require('./town.validation');
const { authenticate, requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.post('/add', authenticate, requireAdmin, addTownRules, addTown);
router.get('/list', listTowns);

module.exports = router;
