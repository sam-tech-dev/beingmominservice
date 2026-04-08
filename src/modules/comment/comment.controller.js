const { validationResult } = require('express-validator');
const Comment = require('./comment.model');
const CommentReaction = require('../comment-reaction/comment-reaction.model');
const { REACTION_TYPES } = require('../reaction/reaction.model');

const COMMENT_PAGE_LIMIT = 10;

const buildCommentSummary = () => Object.fromEntries(REACTION_TYPES.map((t) => [t, 0]));

const add = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { newsId, text } = req.body;
    const comment = await Comment.create({ news: newsId, user: req.user.id, text });
    await comment.populate('user', 'name profilePhoto');

    const enriched = {
      ...comment.toObject(),
      reactionSummary: buildCommentSummary(),
      totalReactions: 0,
      userReaction: null,
    };

    res.status(201).json({ comment: enriched });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const { newsId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * COMMENT_PAGE_LIMIT;

    const [comments, total] = await Promise.all([
      Comment.find({ news: newsId })
        .populate('user', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(COMMENT_PAGE_LIMIT),
      Comment.countDocuments({ news: newsId }),
    ]);

    const totalPages = Math.ceil(total / COMMENT_PAGE_LIMIT);

    // Enrich comments with reaction summaries and current user's reaction
    const commentIds = comments.map((c) => c._id);
    const [reactionAgg, userReactions] = await Promise.all([
      CommentReaction.aggregate([
        { $match: { comment: { $in: commentIds } } },
        { $group: { _id: { comment: '$comment', type: '$type' }, count: { $sum: 1 } } },
      ]),
      CommentReaction.find({ comment: { $in: commentIds }, user: req.user.id }).select('comment type'),
    ]);

    const summaryMap = {};
    for (const { _id, count } of reactionAgg) {
      const cId = _id.comment.toString();
      if (!summaryMap[cId]) summaryMap[cId] = buildCommentSummary();
      summaryMap[cId][_id.type] = count;
    }
    const userReactionMap = {};
    for (const r of userReactions) userReactionMap[r.comment.toString()] = r.type;

    const enriched = comments.map((c) => {
      const cId = c._id.toString();
      const summary = summaryMap[cId] ?? buildCommentSummary();
      const totalReactions = Object.values(summary).reduce((a, b) => a + b, 0);
      return { ...c.toObject(), reactionSummary: summary, totalReactions, userReaction: userReactionMap[cId] ?? null };
    });

    res.json({
      comments: enriched,
      pagination: { total, page, totalPages, hasNextPage: page < totalPages },
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { add, list, remove };
