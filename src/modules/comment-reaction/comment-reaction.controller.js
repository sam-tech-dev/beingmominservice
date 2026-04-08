const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const CommentReaction = require('./comment-reaction.model');
const { buildSummary } = require('../reaction/reaction.controller');

const toggle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { commentId, type } = req.body;
    const userId = req.user.id;

    const existing = await CommentReaction.findOne({ comment: commentId, user: userId });

    if (existing) {
      if (existing.type === type) {
        await existing.deleteOne();
      } else {
        existing.type = type;
        await existing.save();
      }
    } else {
      await CommentReaction.create({ comment: commentId, user: userId, type });
    }

    const agg = await CommentReaction.aggregate([
      { $match: { comment: new mongoose.Types.ObjectId(commentId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const summary = buildSummary(agg);
    const totalReactions = Object.values(summary).reduce((a, b) => a + b, 0);
    const updated = await CommentReaction.findOne({ comment: commentId, user: userId });
    const userReaction = updated ? updated.type : null;

    res.json({ userReaction, summary, totalReactions });
  } catch (error) {
    next(error);
  }
};

const listReactors = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { commentId, type } = req.query;
    const filter = { comment: commentId };
    if (type) filter.type = type;

    const reactions = await CommentReaction.find(filter)
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ reactions });
  } catch (error) {
    next(error);
  }
};

module.exports = { toggle, listReactors };
