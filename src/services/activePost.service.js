const ActivePost = require('../models/activePost.model');

const getActivePostsWithUserInfoByFilter = async (filter, page = 1, limit = 20) => {
    return await ActivePost.find(filter)
        .sort({ createdAt: -1 })
        .populate('user', '_id username avatar isPremium')
        .skip((page - 1) * limit)
        .limit(limit);
};

const addActivePost = async (
    { postId, userId, content, imageUrls, privacy, location, expiredAt, selectedLocation, maxParticipants, activityType }
) => {
    const activePost = new ActivePost({
        postId,
        user: userId,
        content,
        imageUrls,
        privacy,
        location,
        expiredAt,
        selectedLocation,
        maxParticipants,
        activityType
    });

    return await activePost.save();
};

const updateActivePostByPostId = async (postId, updates) => {
    const updateFields = {};

    ['content', 'privacy', 'imageUrls', 'location', 'maxParticipants'].forEach(field => {
        if (updates[field] !== undefined) {
            updateFields[field] = updates[field];
        }
    });

    if (updates.selectedLocation) {
        ['locationName', 'address', 'type', 'category'].forEach(field => {
            if (updates.selectedLocation[field] !== undefined) {
                updateFields[`selectedLocation.${field}`] = updates.selectedLocation[field];
            }
        });
    }

    await ActivePost.findOneAndUpdate({ postId }, { $set: updateFields });
};

const deleteActivePostByPostId = async (postId) => {
    await ActivePost.deleteOne({ postId });
};

// For deleted expired posts (cron job).
const getExpiredActivePosts = async () => {
    const now = new Date();
    return await ActivePost.find({
        expiredAt: { $lte: now },
    });
};

module.exports = {
    getActivePostsWithUserInfoByFilter,
    addActivePost,
    updateActivePostByPostId,
    deleteActivePostByPostId,
    getExpiredActivePosts,
}