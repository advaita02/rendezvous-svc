const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    url: { type: String, required: true, },
    key: { type: String, required: true, },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, },
    description: { type: String, },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true
});

module.exports = mongoose.model('Image', imageSchema);
