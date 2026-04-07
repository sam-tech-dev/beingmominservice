const { validationResult } = require('express-validator');
const Town = require('./town.model');

const addTown = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, post, block, district, state, pincode } = req.body;

    const existing = await Town.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(409).json({ message: 'A town with this name already exists' });
    }

    const town = await Town.create({ name, post, block, district, state, pincode });

    res.status(201).json({ town });
  } catch (error) {
    next(error);
  }
};

const listTowns = async (req, res, next) => {
  try {
    const towns = await Town.find().sort({ name: 1 });
    res.json({ towns });
  } catch (error) {
    next(error);
  }
};

module.exports = { addTown, listTowns };
