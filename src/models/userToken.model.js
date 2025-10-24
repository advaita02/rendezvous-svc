const mongoose = require('mongoose');

const UserTokenSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, },
    accessToken: { type: String, required: true, },
    refreshToken: { type: String, required: true, unique: true, },
    userAgent: { type: String, },
    ipAddress: { type: String, },
    accessTokenExpiresAt: { type: Date, required: true, },
    refreshTokenExpiresAt: { type: Date, required: true, },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('UserToken', UserTokenSchema);
