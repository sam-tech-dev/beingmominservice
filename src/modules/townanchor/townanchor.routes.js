const express = require('express');
const { signup, login } = require('./townanchor.controller');
const { signupRules, loginRules } = require('./townanchor.validation');

const router = express.Router();

router.post('/signup', signupRules, signup);
router.post('/login', loginRules, login);

module.exports = router;
