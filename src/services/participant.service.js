const Participant = require('../models/participant.model');

const findParticipantByPostIdUserId = async (postId, userId) => {
    const participant = await Participant.findOne({
        post: postId,
        user: userId,
        deletedAt: null
    }).populate('user post');
    return participant;
};

const findParticipantById = async (id) => {
    const participant = await Participant.findById(id).populate('user post');
    return participant;
};

const setCancelledAndsoftDeleteParticipantByObject = async (participant) => {
    participant.status = 'cancelled';
    participant.deletedAt = new Date();
    await participant.save();

    return participant;
};

const countApprovedParticipantByPostId = async (postId) => {
    const joinedCount = await Participant.countDocuments({
        post: postId,
        status: 'approved',
        deletedAt: null,
    });
    return joinedCount;
};

const createPendingParticipantByPostIdUserId = async (postId, userId) => {
    const newParticipant = await Participant.create({
        post: postId,
        user: userId,
        status: 'pending'
    });

    await newParticipant.populate('post');
    return newParticipant;
};

// const getAllParticipantsByPostIdAndStatus = async (postId, status) => {
//     const participants = await Participant.find({
//         post: postId,
//         deletedAt: null,
//         status,
//     }).populate('user', '-password');

//     return participants;
// };

const countParticipantsByPostIdAndStatus = async (postId, status) => {
    return Participant.countDocuments({
        post: postId,
        deletedAt: null,
        status,
    });
};

const getParticipantsByPostIdAndStatusPaginated = async (postId, status, skip, limit) => {
    return Participant.find({
        post: postId,
        deletedAt: null,
        status,
    })
        .populate('user', '-password')
        .skip(skip)
        .limit(limit);
};

const countJoinParticipantPostsByUserId = async (userId) => {
    const count = await Participant.countDocuments({
        user: userId,
        status: 'approved',
        deletedAt: null,
    })
    return count;
};

const softDeleteParticipantsByPostId = async (postId) => {
    await Participant.updateMany(
        { post: postId, deletedAt: null },
        { $set: { deletedAt: new Date() } }
    );
};

module.exports = {
    findParticipantByPostIdUserId,
    findParticipantById,
    setCancelledAndsoftDeleteParticipantByObject,
    countApprovedParticipantByPostId,
    countJoinParticipantPostsByUserId,
    createPendingParticipantByPostIdUserId,
    countParticipantsByPostIdAndStatus,
    getParticipantsByPostIdAndStatusPaginated,
    softDeleteParticipantsByPostId,
};