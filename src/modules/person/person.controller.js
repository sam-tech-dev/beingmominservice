const { validationResult } = require('express-validator');
const Person = require('./person.model');
const TownAnchor = require('../townanchor/townanchor.model');
const { getFileUrl } = require('../../services/storage');

const PERSON_PAGE_LIMIT = 20;
const SEARCH_LIMIT = 20;

const RELATION_POPULATE = [
  { path: 'town', select: 'name district state' },
  { path: 'fatherId', select: 'name profilePhoto', populate: { path: 'town', select: 'name' } },
  { path: 'motherId', select: 'name profilePhoto', populate: { path: 'town', select: 'name' } },
  { path: 'lifePartnerIds', select: 'name profilePhoto', populate: { path: 'town', select: 'name' } },
];

const add = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    let townId = req.body.townId;

    if (!req.user.isAdmin) {
      // Non-admin townanchor: must use their own town
      const anchor = await TownAnchor.findById(req.user.id).select('town');
      if (!anchor) return res.status(401).json({ message: 'Anchor not found' });
      townId = anchor.town;
    }

    const profilePhoto = req.file ? getFileUrl(req.file.filename, req) : null;

    const { name, mobileNumber, dateOfBirth, gender, maritalStatus, profession, highestEducation, isAlive, fatherId, motherId, lifePartnerIds } = req.body;

    const person = await Person.create({
      name,
      profilePhoto,
      mobileNumber: mobileNumber || null,
      dateOfBirth: dateOfBirth || null,
      gender,
      maritalStatus,
      profession: profession || null,
      highestEducation: highestEducation || null,
      town: townId,
      isAlive: isAlive !== undefined ? isAlive === 'true' || isAlive === true : true,
      fatherId: fatherId || null,
      motherId: motherId || null,
      lifePartnerIds: Array.isArray(lifePartnerIds) ? lifePartnerIds : lifePartnerIds ? [lifePartnerIds] : [],
      addedBy: req.user.id,
    });

    await person.populate(RELATION_POPULATE);

    res.status(201).json({ person });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const person = await Person.findById(req.params.id);
    if (!person) return res.status(404).json({ message: 'Person not found' });

    if (!req.user.isAdmin) {
      const anchor = await TownAnchor.findById(req.user.id).select('town');
      if (!anchor) return res.status(401).json({ message: 'Anchor not found' });
      if (person.town.toString() !== anchor.town.toString()) {
        return res.status(403).json({ message: 'You can only edit people from your own town' });
      }
    }

    const { name, mobileNumber, dateOfBirth, gender, maritalStatus, profession, highestEducation, isAlive, fatherId, motherId, lifePartnerIds, townId } = req.body;

    if (name !== undefined) person.name = name;
    if (mobileNumber !== undefined) person.mobileNumber = mobileNumber || null;
    if (dateOfBirth !== undefined) person.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) person.gender = gender;
    if (maritalStatus !== undefined) person.maritalStatus = maritalStatus;
    if (profession !== undefined) person.profession = profession || null;
    if (highestEducation !== undefined) person.highestEducation = highestEducation || null;
    if (isAlive !== undefined) person.isAlive = isAlive === 'true' || isAlive === true;
    if (fatherId !== undefined) person.fatherId = fatherId || null;
    if (motherId !== undefined) person.motherId = motherId || null;
    if (lifePartnerIds !== undefined) {
      person.lifePartnerIds = Array.isArray(lifePartnerIds) ? lifePartnerIds : lifePartnerIds ? [lifePartnerIds] : [];
    }
    if (req.user.isAdmin && townId) person.town = townId;
    if (req.file) person.profilePhoto = getFileUrl(req.file.filename, req);

    await person.save();
    await person.populate(RELATION_POPULATE);

    res.json({ person });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * PERSON_PAGE_LIMIT;
    const filter = {};

    if (req.user.role === 'townanchor') {
      if (req.user.isAdmin) {
        // Admin: optional town filter
        if (req.query.town) filter.town = req.query.town;
      } else {
        // Non-admin anchor: always their own town
        const anchor = await TownAnchor.findById(req.user.id).select('town');
        if (!anchor) return res.status(401).json({ message: 'Anchor not found' });
        filter.town = anchor.town;
      }
    } else {
      // Community user: must specify a town
      if (!req.query.town) {
        return res.status(400).json({ message: 'town query parameter is required' });
      }
      filter.town = req.query.town;
    }

    if (req.query.q) {
      filter.name = { $regex: req.query.q.trim(), $options: 'i' };
    }

    const [persons, total] = await Promise.all([
      Person.find(filter)
        .populate('town', 'name district state')
        .sort({ name: 1 })
        .skip(skip)
        .limit(PERSON_PAGE_LIMIT),
      Person.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / PERSON_PAGE_LIMIT);

    res.json({
      persons,
      pagination: { total, page, totalPages, hasNextPage: page < totalPages },
    });
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ persons: [] });

    const persons = await Person.find({ name: { $regex: q, $options: 'i' } })
      .select('name profilePhoto dateOfBirth gender')
      .populate('town', 'name')
      .limit(SEARCH_LIMIT)
      .sort({ name: 1 });

    res.json({ persons });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id).populate(RELATION_POPULATE);
    if (!person) return res.status(404).json({ message: 'Person not found' });

    const children = await Person.find({
      $or: [{ fatherId: person._id }, { motherId: person._id }],
    })
      .select('name profilePhoto dateOfBirth isAlive gender')
      .populate('town', 'name')
      .sort({ dateOfBirth: 1 });

    res.json({ person: { ...person.toObject(), children } });
  } catch (error) {
    next(error);
  }
};

module.exports = { add, update, list, search, getOne };
