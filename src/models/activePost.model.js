const mongoose = require('mongoose');

const activePostSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: String,
    imageUrls: [{ type: String, }],
    privacy: { type: String, enum: ['public', 'friend'], default: 'public', },
    expiredAt: Date,
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
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

activePostSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ActivePost', activePostSchema);