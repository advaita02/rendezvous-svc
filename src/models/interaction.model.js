const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  type: { type: String, enum: ['like', 'dislike', 'join', ], },
  deletedAt: { type: Date, default: null },
}, {
  timestamps: true
});

interactionSchema.index({ user: 1, post: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Interaction', interactionSchema);
