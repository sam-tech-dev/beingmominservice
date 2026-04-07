const { validationResult } = require('express-validator');
const Comment = require('./comment.model');

const COMMENT_PAGE_LIMIT = 10;

const add = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { newsId, text } = req.body;
    const comment = await Comment.create({ news: newsId, user: req.user.id, text });
    await comment.populate('user', 'name profilePhoto');

    res.status(201).json({ comment });
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

    res.json({
      comments,
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
