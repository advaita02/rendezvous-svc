const Notification = require('../models/notification.model');
const Post = require('../models/post.model');
const { buildNotificationResponse } = require('../utils/responseBuilder');

const getAllNotificationsOfUserId = async (userId, page = 1, limit = 10) => {
    const [total, unreadedNotiTotal] = await Promise.all([
        Notification.countDocuments({ user: userId, deletedAt: null }),
        Notification.countDocuments({ user: userId, deletedAt: null, isRead: false }),
    ]);

    const notifications = await Notification.find({
        user: userId,
        deletedAt: null,
        // expiredAt: { $gt: new Date() },
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
            path: 'interaction',
            select: '_id type',
        })
        .populate({
            path: 'actor',
            select: '_id username avatar isPremium',
        });

    return {
        data: notifications.map(noti => buildNotificationResponse(noti)),
        unreadTotal: unreadedNotiTotal,
        pagination: {
            page,
            limit,
            total,
            hasMore: page * limit < total,
        },
    };
};

/**
 * Add a new notification for a user based on the interaction type.
 * 
 * @param {mongoose.Types.ObjectId} userId - User receiving the notification
 * @param {mongoose.Types.ObjectId} actorId - User who triggered the action
 * @param {"comment" | "interaction" | "friendRequest" | "participant"} type - Type of target model
 * @param {mongoose.Types.ObjectId} objectId - Related object ID (comment / interaction / friendRequest / participant)
 * @param {Date|null} expiredAt - Optional expiry date of the notification
 * @param {string} message - Notification content
 * @param {mongoose.Types.ObjectId|null} relatedPostId - Optional post related to the notification
 * @returns {Promise<Notification>}
 */
const addNotification = async (userId, actorId, type, objectId, expiredAt = null, message, relatedPostId = null) => {
    const notificationData = {
        user: userId,
        actor: actorId,
        type,
        isRead: false,
        message,
        expiredAt,
    };
    //add get objectId.
    if (type === 'interaction') {
        notificationData.interaction = objectId;
        notificationData.relatedPost = relatedPostId;

    } else if (type === 'comment') {
        notificationData.comment = objectId;
        notificationData.relatedPost = relatedPostId;
    } else if (type === 'friendRequest') {
        notificationData.friendRequest = objectId;
    } else if (type === 'participant') {
        notificationData.participant = objectId;
        notificationData.relatedPost = relatedPostId;
    };

    if (relatedPostId && !expiredAt) {
        const relatedPost = await Post.findById(relatedPostId).select('expiredAt');
        if (relatedPost) {
            notificationData.expiredAt = relatedPost.expiredAt;
        }
    };

    const newNotification = await Notification.create(notificationData);
    return newNotification;
};

const softDeleteNotificationById = async (id) => {
    const now = new Date();
    const softDeletedNotification = await Notification.findByIdAndUpdate(
        id,
        { deletedAt: now },
        { new: true }
    );
    return softDeletedNotification;
};

const setDeletedAtNullNotificationById = async (id) => {
    const updatedNotification = await Notification.findByIdAndUpdate(
        id,
        { deletedAt: null },
        { new: true }
    ).populate('actor user', '_id username avatar isPremium');
    return updatedNotification ? buildNotificationResponse(updatedNotification) : null;
};

const findAndChangeUserAndActorOfNotificationById = async (id, userId, actorId) => {
    return await Notification.findByIdAndUpdate(
        id,
        { user: userId, actor: actorId },
        { runValidators: true, new: true }
    );
};

const findNotificationByTypeAndObjectId = async (type, objectId) => {
    const query = {
        [type]: objectId,
    };

    return await Notification.findOne(query);
};

const updateMessageNotificationById = async (message, notificationId) => {
    const updated = await Notification.findByIdAndUpdate(
        notificationId,
        { message: message },
        { runValidators: true, new: true }
    );
    return updated;
};

const markAllNotificationsAsReadByUserId = async (userId) => {
    await Notification.updateMany(
        { user: userId, isRead: false, deletedAt: null },
        { isRead: true }
    );
};

const markNotificationAsReadByNotiId = async (id) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { isRead: true },
        { new: true }
    );

    return notification;
};

const updateNotificationActorAndUser = async (notificationId, newActorId, newUserId) => {
    const updatedNotification = await Notification.findByIdAndUpdate(
        notificationId,
        {
            actor: newActorId,
            user: newUserId
        },
        { new: true }
    ).populate('user actor interaction comment friendRequest relatedPost');

    return updatedNotification;
};

/**
 * Find a notification by actor, user, type, and corresponding targetId.
 *
 * @param {string} actorId
 * @param {string} userId
 * @param {'comment'|'interaction'|'friendRequest'|'participant'} type
 * @param {string} targetId - ID of comment / interaction / friendRequest by type.
 * @returns {Promise<Object|null>}
 */
const findNotificationByDetails = async (actorId, userId, type, targetId) => {
    const query = {
        actor: actorId,
        user: userId,
        type,
        [type]: targetId,
        deletedAt: null,
    };

    return await Notification.findOne(query);

};

/**
 * Find a notification by actor, user, type, and corresponding targetId.
 *
 * @param {string} actorId
 * @param {string} userId
 * @param {'comment'|'interaction'|'friendRequest'|'participant'} type
 * @param {string} targetId - ID of comment / interaction / friendRequest by type.
 * @returns {Promise<Object|null>}
 */
const findDeletedNotificationByDetails = async (actorId, userId, type, targetId) => {
    const query = {
        actor: actorId,
        user: userId,
        type,
        [type]: targetId,
        deletedAt: { $ne: null },
    };

    return await Notification.findOne(query);

};


module.exports = {
    addNotification,
    findNotificationByTypeAndObjectId,
    softDeleteNotificationById,
    getAllNotificationsOfUserId,
    updateMessageNotificationById,
    setDeletedAtNullNotificationById,
    findAndChangeUserAndActorOfNotificationById,
    markAllNotificationsAsReadByUserId,
    markNotificationAsReadByNotiId,
    updateNotificationActorAndUser,
    findNotificationByDetails,
    findDeletedNotificationByDetails,
}