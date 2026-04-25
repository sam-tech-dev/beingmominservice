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
  town: anchor.town ?? null,
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

    if (townId) {
      const townExists = await Town.findById(townId);
      if (!townExists) {
        return res.status(404).json({ message: 'Selected town not found' });
      }
    }

    const existing = await TownAnchor.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }

    const anchor = await TownAnchor.create({ name, phone, town: townId || undefined, password });
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

const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, townId } = req.body;

    if (townId) {
      const townExists = await Town.findById(townId);
      if (!townExists) {
        return res.status(404).json({ message: 'Selected town not found' });
      }
    }

    const update = {};
    if (name) update.name = name;
    if (townId) update.town = townId;

    const anchor = await TownAnchor.findByIdAndUpdate(req.user.id, update, { new: true }).populate('town', 'name district state');

    res.json({ user: formatUser(anchor) });
  } catch (error) {
    next(error);
  }
};

const ANCHOR_PAGE_LIMIT = 20;

const listAnchors = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const q = req.query.q?.trim();
    const skip = (page - 1) * ANCHOR_PAGE_LIMIT;

    let filter = {};
    if (q) {
      const matchingTowns = await Town.find({ name: { $regex: q, $options: 'i' } }).select('_id');
      const townIds = matchingTowns.map((t) => t._id);
      filter = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { town: { $in: townIds } },
        ],
      };
    }

    const [anchors, total] = await Promise.all([
      TownAnchor.find(filter)
        .populate('town', 'name district state')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(ANCHOR_PAGE_LIMIT),
      TownAnchor.countDocuments(filter),
    ]);

    res.json({
      anchors: anchors.map(formatUser),
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / ANCHOR_PAGE_LIMIT),
        hasNextPage: page * ANCHOR_PAGE_LIMIT < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

const setVerification = async (req, res, next) => {
  try {
    const anchor = await TownAnchor.findById(req.params.id).populate('town', 'name district state');
    if (!anchor) {
      return res.status(404).json({ message: 'Town anchor not found' });
    }

    const verified = req.body.verified === true;

    if (verified && !anchor.town) {
      return res.status(400).json({ message: 'Town anchor must set a town in their profile before being verified' });
    }

    anchor.isVerified = verified;
    await anchor.save();

    res.json({ user: formatUser(anchor) });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, updateProfile, listAnchors, setVerification };
