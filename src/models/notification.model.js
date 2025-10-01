const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['comment', 'interaction', 'friendRequest', 'participant'],
        required: true,
    },
    interaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Interaction', default: null },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    friendRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'FriendRequest', default: null },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', default: null },

    relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },

    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, },
    isRead: { type: Boolean, default: false },
    expiredAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);