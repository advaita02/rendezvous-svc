const mongoose = require('mongoose');

const premiumUpgradeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
    expiredAt: { type: Date, },
    method: { type: String },
}, {
    timestamps: true,
})

module.exports = mongoose.model('PremiumUpgrade', premiumUpgradeSchema);