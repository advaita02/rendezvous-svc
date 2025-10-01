const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['approved', 'pending', 'cancelled', 'rejected'], default: 'pending' },
    joinedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true
});

participantSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Participant', participantSchema);
