const express = require('express');
const { add, update, list, search, getOne, getRoots, getTree } = require('./person.controller');
const { addRules, updateRules } = require('./person.validation');
const { authenticate, requireRole } = require('../../middleware/auth');
const { upload } = require('../../services/storage');

const router = express.Router();

// Write — townanchor only
router.post('/', authenticate, requireRole('townanchor'), upload.single('profilePhoto'), addRules, add);
router.patch('/:id', authenticate, requireRole('townanchor'), upload.single('profilePhoto'), updateRules, update);

// Read — any authenticated role
router.get('/list', authenticate, list);
router.get('/search', authenticate, search);
router.get('/roots', authenticate, getRoots);     // must be before /:id
router.get('/:id/tree', authenticate, getTree);   // must be before /:id
router.get('/:id', authenticate, getOne);

module.exports = router;
