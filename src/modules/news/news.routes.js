const express = require('express');
const { publish, list, getOne } = require('./news.controller');
const { publishRules } = require('./news.validation');
const { authenticate } = require('../../middleware/auth');
const { upload } = require('../../services/storage');

const router = express.Router();

router.post('/publish', authenticate, upload.single('image'), publishRules, publish);
router.get('/list', authenticate, list);
router.get('/:id', authenticate, getOne);

module.exports = router;
