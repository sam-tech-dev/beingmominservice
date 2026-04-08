const mongoose = require('mongoose');
const { REACTION_TYPES } = require('../reaction/reaction.model');

const commentReactionSchema = new mongoose.Schema(
  {
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: REACTION_TYPES, required: true },
  },
  { timestamps: true }
);

commentReactionSchema.index({ comment: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('CommentReaction', commentReactionSchema);
