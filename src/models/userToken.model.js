const mongoose = require('mongoose');

const UserTokenSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, },
    accessToken: { type: String, required: true, },
    refreshToken: { type: String, required: true, unique: true, },
    userAgent: { type: String, }, //mô tả OS hay Browser đăng nhập
    ipAddress: { type: String, }, //Địa chỉ IP thiết bị người dùng
    accessTokenExpiresAt: { type: Date, required: true, },
    refreshTokenExpiresAt: { type: Date, required: true, },
    deletedAt: { type: Date, default: null }, //maybe đổi lại.
}, {
    timestamps: true,
});

module.exports = mongoose.model('UserToken', UserTokenSchema);
