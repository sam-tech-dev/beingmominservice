const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('./user.model');
const Town = require('../town/town.model');
const { getFileUrl } = require('../../services/storage');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  town: user.town,
  profilePhoto: user.profilePhoto,
});

const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, phone, townId, password, email } = req.body;

    const townExists = await Town.findById(townId);
    if (!townExists) {
      return res.status(404).json({ message: 'Selected town not found' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }

    const user = await User.create({
      name,
      phone,
      town: townId,
      password,
      email: email || null,
    });

    await user.populate('town', 'name district state');

    const token = signToken(user);
    res.status(201).json({ token, user: formatUser(user) });
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

    const user = await User.findOne({ phone })
      .select('+password')
      .populate('town', 'name district state');

    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    const token = signToken(user);
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('town', 'name district state');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { email, townId, currentPassword, newPassword } = req.body;

    if (email !== undefined) user.email = email || null;

    if (townId) {
      const townExists = await Town.findById(townId);
      if (!townExists) {
        return res.status(404).json({ message: 'Selected town not found' });
      }
      user.town = townId;
    }

    if (newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    if (req.file) {
      user.profilePhoto = getFileUrl(req.file.filename, req);
    }

    await user.save();
    await user.populate('town', 'name district state');

    res.json({ user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getProfile, updateProfile };
