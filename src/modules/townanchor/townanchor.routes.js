const express = require('express');
const { signup, login, updateProfile, listAnchors, setVerification } = require('./townanchor.controller');
const { signupRules, loginRules, updateProfileRules } = require('./townanchor.validation');
const { authenticate, requireRole, requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.post('/signup', signupRules, signup);
router.post('/login', loginRules, login);
router.put('/profile', authenticate, requireRole('townanchor'), updateProfileRules, updateProfile);
router.get('/', authenticate, requireRole('townanchor'), requireAdmin, listAnchors);
router.patch('/:id/verify', authenticate, requireRole('townanchor'), requireAdmin, setVerification);

module.exports = router;
