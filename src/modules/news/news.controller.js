const { validationResult } = require('express-validator');
const News = require('./news.model');
const { getFileUrl } = require('../../services/storage');

const publish = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { title, body } = req.body;
    const imageUrl = req.file ? getFileUrl(req.file.filename, req) : null;

    const news = await News.create({
      title,
      body,
      imageUrl,
      author: req.user.id,
      town: req.user.town,
    });

    await news.populate('author', 'name town');

    res.status(201).json({ news });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.town) {
      filter.town = req.query.town;
    }

    const news = await News.find(filter)
      .populate('author', 'name town')
      .sort({ createdAt: -1 });

    res.json({ news });
  } catch (error) {
    next(error);
  }
};

module.exports = { publish, list };
