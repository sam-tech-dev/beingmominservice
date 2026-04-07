const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const TownAnchor = require('./townanchor.model');

const signToken = (anchor) =>
  jwt.sign(
    { id: anchor._id, role: 'townanchor', town: anchor.town },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const formatUser = (anchor) => ({
  id: anchor._id,
  name: anchor.name,
  phone: anchor.phone,
  town: anchor.town,
  isVerified: anchor.isVerified,
});

const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, phone, town, password } = req.body;

    const existing = await TownAnchor.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }

    const anchor = await TownAnchor.create({ name, phone, town, password });
    const token = signToken(anchor);

    res.status(201).json({ token, user: formatUser(anchor) });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    const anchor = await TownAnchor.findOne({ phone }).select('+password');
    if (!anchor) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    const isMatch = await anchor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    const token = signToken(anchor);

    res.json({ token, user: formatUser(anchor) });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login };
