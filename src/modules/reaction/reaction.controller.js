const { validationResult } = require('express-validator');
const Reaction = require('./reaction.model');
const { REACTION_TYPES } = require('./reaction.model');

const buildSummary = (agg) => {
  const summary = Object.fromEntries(REACTION_TYPES.map((t) => [t, 0]));
  for (const { _id, count } of agg) summary[_id] = count;
  return summary;
};

const toggle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { newsId, type } = req.body;
    const userId = req.user.id;

    const existing = await Reaction.findOne({ news: newsId, user: userId });

    if (existing) {
      if (existing.type === type) {
        // Same type → toggle off
        await existing.deleteOne();
      } else {
        // Different type → update
        existing.type = type;
        await existing.save();
      }
    } else {
      await Reaction.create({ news: newsId, user: userId, type });
    }

    const agg = await Reaction.aggregate([
      { $match: { news: new (require('mongoose').Types.ObjectId)(newsId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const summary = buildSummary(agg);
    const totalReactions = Object.values(summary).reduce((a, b) => a + b, 0);

    const updated = await Reaction.findOne({ news: newsId, user: userId });
    const userReaction = updated ? updated.type : null;

    res.json({ userReaction, summary, totalReactions });
  } catch (error) {
    next(error);
  }
};

module.exports = { toggle, buildSummary };
