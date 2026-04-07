const express = require('express');
const { signup, login, getProfile, updateProfile } = require('./user.controller');
const { signupRules, loginRules, updateProfileRules } = require('./user.validation');
const { authenticate, requireRole } = require('../../middleware/auth');
const { upload } = require('../../services/storage');

const router = express.Router();

const requireUser = requireRole('user');

router.post('/signup', signupRules, signup);
router.post('/login', loginRules, login);
router.get('/profile', authenticate, requireUser, getProfile);
router.patch('/profile', authenticate, requireUser, upload.single('profilePhoto'), updateProfileRules, updateProfile);

module.exports = router;
