const express = require('express');
const { add, update, list, search, getOne } = require('./person.controller');
const { addRules, updateRules } = require('./person.validation');
const { authenticate, requireRole } = require('../../middleware/auth');
const { upload } = require('../../services/storage');

const router = express.Router();

// Write — townanchor only
router.post('/', authenticate, requireRole('townanchor'), upload.single('profilePhoto'), addRules, add);
router.patch('/:id', authenticate, requireRole('townanchor'), upload.single('profilePhoto'), updateRules, update);

// Read — any authenticated role (user or townanchor)
router.get('/list', authenticate, list);
router.get('/search', authenticate, search);
router.get('/:id', authenticate, getOne);

module.exports = router;
