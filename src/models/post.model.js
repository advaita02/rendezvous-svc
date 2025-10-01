const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, },
    content: { type: String, required: true, trim: true, },
    imageUrls: [{ type: String, }],
    privacy: { type: String, enum: ['public', 'friend'], default: 'public', },
    expiredAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null },
    location: {
        type: {
            type: String, enum: ["Point"], required: true, default: "Point",
        },
        coordinates: {
            type: [Number], required: true, default: [0, 0],
        }
    },
    selectedLocation: {
        locationName: { type: String },
        address: { type: String },
        type: { type: String },
        category: { type: String },
    },

    maxParticipants: { type: Number, min: 1, default: null },
    activityType: { type: String, default: null },

}, {
    timestamps: true
});

postSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Post', postSchema);