const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', required: true, },
}, {
    timestamps: true
});

friendRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);