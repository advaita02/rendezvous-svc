const { default: mongoose } = require('mongoose');
const Interaction = require('../models/interaction.model');
const Participant = require('../models/participant.model');
const postService = require('../services/post.service');
const userService = require('../services/user.service');
const { buildShortDetailUserResponse } = require('../utils/responseBuilder');

// const countInteractionsByPostId = async (postId) => {
//     const result = await Interaction.aggregate([
//         {
//             $match: {
//                 post: new mongoose.Types.ObjectId(postId),
//                 deletedAt: null,
//             },

//         },
//         {
//             $group: {
//                 _id: '$type',
//                 count: { $sum: 1 }
//             }
//         }
//     ]);

//     const summary = { like: 0, dislike: 0, join: 0 };
//     result.forEach(item => { summary[item._id] = item.count })
//     return summary;
// };

const countInteractionsByPostId = async (postId) => {
    const postObjectId = new mongoose.Types.ObjectId(postId);

    const interactions = await Interaction.aggregate([
        {
            $match: {
                post: postObjectId,
                deletedAt: null,
            },
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]);

    const joinCount = await Participant.countDocuments({
        post: postObjectId,
        status: 'approved',
        deletedAt: null
    });

    const summary = { like: 0, dislike: 0, join: joinCount };
    interactions.forEach(item => {
        summary[item._id] = item.count;
    });

    return summary;
};

const countJoinsByUserId = async (userId) => {
    const count = await Interaction.countDocuments({
        user: userId,
        type: 'join',
        deletedAt: null,
    })
    return count
};

const getJoinedInteractionsAndPopulatePostByUserId = async (userId) => {
    return await Interaction.find({
        user: userId,
        type: 'join',
    }).populate({
        path: 'post',
        populate: {
            path: 'user',
            select: '_id username avatar isPremium'
        }
    });
};

const getUsersInteractPost = async (post, type = null, page = 1, limit = 10) => {
    const filter = {
        post,
        deletedAt: null,
    };

    if (type) {
        filter.type = type;
    };

    const interactions = await Interaction.find(filter)
        .sort({ createdAt: -1 })
        .populate('user', '_id username avatar isPremium')
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await Interaction.countDocuments(filter);

    const result = {
        data: interactions.map(interaction => ({
            user: buildShortDetailUserResponse(interaction.user),
            type: interaction.type
        })),
        pagination: {
            page,
            limit,
            total,
            hasMore: page * limit < total
        }
    };

    return result;
};

const hasDisliked = async (userId, postId) => {
    return await Interaction.findOne({
        user: userId,
        post: postId,
        type: 'dislike',
    });
};

const hasLiked = async (userId, postId) => {
    return await Interaction.findOne({
        user: userId,
        post: postId,
        type: 'like',
    });
};

const hasJoined = async (userId, postId) => {
    return await Interaction.findOne({
        user: userId,
        post: postId,
        type: 'join',
    });
};

const updateInteraction = async (interaction, type) => {
    interaction.type = type;
    interaction.deletedAt = null;
    const updatedInteraction = await interaction.save();

    await updatedInteraction.populate('post');

    return updatedInteraction;
};

const setDeletedAtNullInteraction = async (interaction) => {
    interaction.deletedAt = null;
    const deletedAtNullInteraction = await interaction.save();
    return deletedAtNullInteraction;
};

const softDeleteInteraction = async (interaction) => {
    const now = new Date();
    interaction.deletedAt = now;
    const softDeletedInteraction = await interaction.save();
    return softDeletedInteraction;
};

const createInteraction = async (userId, postId, type) => {
    const newInteraction = await Interaction.create({
        user: userId,
        post: postId,
        type: type,
    });

    await newInteraction.populate('post');

    return newInteraction;
};


module.exports = {
    countInteractionsByPostId,
    getJoinedInteractionsAndPopulatePostByUserId,
    countJoinsByUserId,
    hasLiked,
    hasDisliked,
    hasJoined,
    updateInteraction,
    softDeleteInteraction,
    createInteraction,
    setDeletedAtNullInteraction,
    getUsersInteractPost,
}