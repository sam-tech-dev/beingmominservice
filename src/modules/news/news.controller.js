const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const News = require('./news.model');
const TownAnchor = require('../townanchor/townanchor.model');
const Reaction = require('../reaction/reaction.model');
const { REACTION_TYPES } = require('../reaction/reaction.model');
const Comment = require('../comment/comment.model');
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

    const [newsItems, total] = await Promise.all([
      News.find(filter)
        .populate('author', 'name')
        .populate('town', 'name district state')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(NEWS_PAGE_LIMIT),
      News.countDocuments(filter),
    ]);

    const newsIds = newsItems.map((n) => n._id);

    const [reactionAgg, commentAgg, userReactions] = await Promise.all([
      Reaction.aggregate([
        { $match: { news: { $in: newsIds } } },
        { $group: { _id: { news: '$news', type: '$type' }, count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { news: { $in: newsIds } } },
        { $group: { _id: '$news', count: { $sum: 1 } } },
      ]),
      Reaction.find({ news: { $in: newsIds }, user: req.user.id }),
    ]);

    // Build lookup maps
    const reactionMap = {};
    for (const { _id, count } of reactionAgg) {
      const newsKey = _id.news.toString();
      if (!reactionMap[newsKey]) reactionMap[newsKey] = Object.fromEntries(REACTION_TYPES.map((t) => [t, 0]));
      reactionMap[newsKey][_id.type] = count;
    }

    const commentMap = {};
    for (const { _id, count } of commentAgg) {
      commentMap[_id.toString()] = count;
    }

    const userReactionMap = {};
    for (const r of userReactions) {
      userReactionMap[r.news.toString()] = r.type;
    }

    const news = newsItems.map((item) => {
      const id = item._id.toString();
      const reactionSummary = reactionMap[id] ?? Object.fromEntries(REACTION_TYPES.map((t) => [t, 0]));
      const totalReactions = Object.values(reactionSummary).reduce((a, b) => a + b, 0);
      return {
        ...item.toObject(),
        reactionSummary,
        totalReactions,
        commentCount: commentMap[id] ?? 0,
        userReaction: userReactionMap[id] ?? null,
      };
    });

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

const getOne = async (req, res, next) => {
  try {
    const newsItem = await News.findById(req.params.id)
      .populate('author', 'name')
      .populate('town', 'name district state');

    if (!newsItem) return res.status(404).json({ message: 'Post not found' });

    const newsId = newsItem._id;

    const [reactionAgg, commentAgg, userReactions] = await Promise.all([
      Reaction.aggregate([
        { $match: { news: newsId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { news: newsId } },
        { $group: { _id: '$news', count: { $sum: 1 } } },
      ]),
      Reaction.findOne({ news: newsId, user: req.user.id }),
    ]);

    const reactionSummary = Object.fromEntries(REACTION_TYPES.map((t) => [t, 0]));
    for (const { _id, count } of reactionAgg) reactionSummary[_id] = count;
    const totalReactions = Object.values(reactionSummary).reduce((a, b) => a + b, 0);
    const commentCount = commentAgg[0]?.count ?? 0;
    const userReaction = userReactions ? userReactions.type : null;

    res.json({
      news: { ...newsItem.toObject(), reactionSummary, totalReactions, commentCount, userReaction },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { publish, list, getOne };
