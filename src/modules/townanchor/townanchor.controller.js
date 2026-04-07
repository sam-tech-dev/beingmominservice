const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const TownAnchor = require('./townanchor.model');
const Town = require('../town/town.model');

const signToken = (anchor) =>
  jwt.sign(
    { id: anchor._id, role: 'townanchor', isAdmin: anchor.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const formatUser = (anchor) => ({
  id: anchor._id,
  name: anchor.name,
  phone: anchor.phone,
  town: anchor.town,
  isVerified: anchor.isVerified,
  isAdmin: anchor.isAdmin,
});

const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, phone, townId, password } = req.body;

    const townExists = await Town.findById(townId);
    if (!townExists) {
      return res.status(404).json({ message: 'Selected town not found' });
    }

    const existing = await TownAnchor.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }

    const anchor = await TownAnchor.create({ name, phone, town: townId, password });
    await anchor.populate('town', 'name district state');

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

    const anchor = await TownAnchor.findOne({ phone })
      .select('+password')
      .populate('town', 'name district state');

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
