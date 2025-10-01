const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, },
    description: { type: String, }
}, {
    timestamps: true,
})

module.exports = mongoose.model('Setting', settingSchema);
