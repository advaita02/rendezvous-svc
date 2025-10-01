const FriendRequest = require('../models/friendRequest.model');
const userService = require('../services/user.service');
const { buildShortDetailUserResponse, buildFriendRequestResponse } = require('../utils/responseBuilder');
// const { buildNotificationResponse, buildFriendRequestResponse } = require('../utils/responseBuilder');

const mongoose = require('mongoose');


const getFriendsByUserId = async (userId) => {
    const requests = await FriendRequest.find({
        status: 'accepted',
        deletedAt: null,
        $or: [
            { fromUser: userId },
            { toUser: userId }
        ]
    }).populate('fromUser toUser', '_id username avatar isPremium');

    const friends = requests.map(reqItem => {
        if (reqItem.fromUser._id.toString() === userId.toString()) {
            return reqItem.toUser;
        } else {
            return reqItem.fromUser;
        }
    });

    return friends;
};

const countFriendsByUserId = async (userId) => {
    const count = await FriendRequest.countDocuments({
        status: 'accepted',
        $or: [
            { fromUser: userId },
            { toUser: userId }
        ]
    });
    return count;
};

const getFriendRequestsByUserId = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
        FriendRequest.find({
            status: 'pending',
            toUser: userId,
        })
            .populate('fromUser toUser', '_id username avatar isPremium')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),

        FriendRequest.countDocuments({
            status: 'pending',
            toUser: userId,
        }),
    ]);

    const result = requests.map(req => buildFriendRequestResponse(req));

    return {
        data: result,
        pagination: {
            page,
            limit,
            total,
            hasMore: skip + result.length < total
        }
    };
};


const getSentFriendRequestsOfUserId = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
        FriendRequest.find({ fromUser: userId, status: 'pending', deletedAt: null })
            .select('-__v')
            .populate('fromUser toUser', '_id username avatar isPremium')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        FriendRequest.countDocuments({ fromUser: userId, status: 'pending', deletedAt: null })
    ]);

    const result = requests.map(req => buildFriendRequestResponse(req));

    return {
        data: result,
        pagination: {
            page,
            limit,
            total,
            hasMore: skip + result.length < total
        }
    };
};

const getFriendRequestByRequestId = async (requestId) => {
    const request = await FriendRequest.findOne({
        _id: requestId,
        status: { $in: ['pending', 'accepted', 'rejected'] },
        deletedAt: null
    }).populate('fromUser toUser', '_id username avatar isPremium');;
    return request;
};

const sendRequest = async (fromUserId, toUserId) => {
    const request = new FriendRequest({
        fromUser: fromUserId,
        toUser: toUserId
    });

    await request.save();
    return request;
};

const updateStatusByRequestId = async (requestId, status) => {
    const reviseRequest = await FriendRequest.findByIdAndUpdate(
        requestId,
        { status: status },
        { runValidators: true, new: true }
    ).populate('fromUser toUser', '_id username avatar isPremium');
    return reviseRequest;
};

const areFriends = async (userId1, userId2) => {
    if (!userId1 || !userId2) return null;

    const friendship = await FriendRequest.findOne({
        $or: [
            { fromUser: userId1, toUser: userId2, status: 'accepted' },
            { fromUser: userId2, toUser: userId1, status: 'accepted' }
        ]
    });

    return friendship;
};

const getFriendIdsByUserId = async (viewerId) => {
    const viewerObjectId = new mongoose.Types.ObjectId(viewerId);

    const friends = await FriendRequest.find({
        status: 'accepted',
        $or: [
            { fromUser: viewerObjectId },
            { toUser: viewerObjectId }
        ]
    }).select('fromUser toUser');

    return friends.map(fr =>
        String(fr.fromUser) === String(viewerId) ? fr.toUser : fr.fromUser
    );
};

const getFriendRequestByfromUserIdAndtoUserId = async (fromUserId, toUserId) => {
    const existing = await FriendRequest.findOne({
        fromUser: fromUserId,
        toUser: toUserId,
        status: { $in: ['pending', 'rejected', 'accepted'] },
    });
    return existing;
};

const findSoftDeletedFriendRequestWithStatusPending = async (fromUserId, toUserId) => {
    const existing = await FriendRequest.findOne({
        fromUser: fromUserId,
        toUser: toUserId,
        status: 'pending',
        deletedAt: { $ne: null }
    });
    return existing;
};

const restoreFriendRequest = async (id) => {
    return await FriendRequest.findByIdAndUpdate(
        id,
        { deletedAt: null },
        { new: true }
    );
};

const softDeleteFriendRequestById = async (id) => {
    return await FriendRequest.findByIdAndUpdate(
        id,
        { deletedAt: new Date() },
        { new: true }
    );
};

const findAndUpdateUsersAndStatusRequestById = async (requestId, newFromUserId, newToUserId, status) => {
    return await FriendRequest.findByIdAndUpdate(
        requestId,
        { fromUser: newFromUserId, toUser: newToUserId, status: status },
        { runValidators: true, new: true }
    );
};


module.exports = {
    getFriendsByUserId,
    getFriendIdsByUserId,
    areFriends,
    getFriendRequestByfromUserIdAndtoUserId,
    getFriendRequestsByUserId,
    getSentFriendRequestsOfUserId,
    sendRequest,
    getFriendRequestByRequestId,
    countFriendsByUserId,
    updateStatusByRequestId,

    findAndUpdateUsersAndStatusRequestById,

    softDeleteFriendRequestById,

    findSoftDeletedFriendRequestWithStatusPending,
    restoreFriendRequest
}