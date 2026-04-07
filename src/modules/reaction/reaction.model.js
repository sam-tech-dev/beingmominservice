const mongoose = require('mongoose');

const REACTION_TYPES = ['like', 'impressed', 'inspired', 'support', 'care'];

const reactionSchema = new mongoose.Schema(
  {
    news: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: REACTION_TYPES, required: true },
  },
  { timestamps: true }
);

reactionSchema.index({ news: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Reaction', reactionSchema);
module.exports.REACTION_TYPES = REACTION_TYPES;
