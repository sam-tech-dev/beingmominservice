const { validationResult } = require('express-validator');
const News = require('./news.model');
const TownAnchor = require('../townanchor/townanchor.model');
const { getFileUrl } = require('../../services/storage');

const NEWS_PAGE_LIMIT = 10;

const publish = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const anchor = await TownAnchor.findById(req.user.id).select('town');
    if (!anchor) {
      return res.status(401).json({ message: 'Anchor not found' });
    }

    const { title, body } = req.body;
    const imageUrl = req.file ? getFileUrl(req.file.filename, req) : null;

    const news = await News.create({
      title,
      body,
      imageUrl,
      author: req.user.id,
      town: anchor.town,
    });

    await news.populate([
      { path: 'author', select: 'name' },
      { path: 'town', select: 'name district state' },
    ]);

    res.status(201).json({ news });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const filter = { createdAt: { $gte: twoMonthsAgo } };

    if (req.query.towns) {
      filter.town = { $in: req.query.towns.split(',').map((id) => id.trim()) };
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * NEWS_PAGE_LIMIT;

    const [news, total] = await Promise.all([
      News.find(filter)
        .populate('author', 'name')
        .populate('town', 'name district state')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(NEWS_PAGE_LIMIT),
      News.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / NEWS_PAGE_LIMIT);

    res.json({
      news,
      pagination: {
        total,
        page,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { publish, list };
