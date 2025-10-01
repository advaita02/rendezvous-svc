const notificationService = require('../services/notification.service');
const userService = require('../services/user.service');


const buildMessage = async (type, object, actorId) => {
    if (!type || !object || !actorId) return null;

    const user = await userService.getUserById(actorId);
    if (!user) return null;

    const username = user.username;
    let message = '';

    const truncate = (text, maxLen = 30) =>
        text && text.length > maxLen ? text.slice(0, maxLen) + "..." : text;

    switch (type) {
        case "comment":
            const content = object?.content || '';
            message = `${username} commented on your post: "${truncate(content)}"`;
            break;

        case "interaction":
            const interactionType = object?.type || 'interacted';
            const postInteractContent = truncate(object?.post?.content || "");

            message = `${username} ${interactionType}d on your post: "${truncate(postInteractContent)}"`;
            break;

        case "friendRequest":
            const friendRequestStatus = object?.status;
            if (friendRequestStatus === "accepted") {
                message = `${username} accepted your friend request.`
            } else if (friendRequestStatus === "pending") {
                message = `${username} sent you a friend request.`;
            }
            break;
        case "participant":
            const participantStatus = object?.status;
            const postParticipantContent = truncate(object?.post?.content || "");

            if (participantStatus === "approved") {
                message = `${username} approved you to join a post: "${postParticipantContent}".`
            } else if (participantStatus === "pending") {
                message = `${username} is waiting for your approval on a post: "${postParticipantContent}".`
            } else if (participantStatus === "rejected") {
                message = `${username} rejected you to join a post: "${postParticipantContent}".`
            }
            break;
        default:
            message = '';
    }

    return message;
};

const findAndSoftDeleteRelatedNotification = async (type, objectId) => {
    const notification = await notificationService.findNotificationByTypeAndObjectId(type, objectId);
    if (notification) {
        return await notificationService.softDeleteNotificationById(notification._id);
    } else {
        return null;
    }
};

const findAndUpdateMessageInNotification = async (type, object, actorId) => {
    const noti = await notificationService.findNotificationByTypeAndObjectId(type, object);
    const newMessage = await buildMessage(type, object, actorId);

    if (noti) {
        return await notificationService.updateMessageNotificationById(newMessage, noti._id);
    } else {
        return null;
    }
};

const findAndUpdateMessageAndActorAndUserInNotification = async (type, object, actorId) => {
    const noti = await notificationService.findNotificationByTypeAndObjectId(type, object);
    const newMessage = await buildMessage(type, object, actorId);
    if (noti) {
        return await Notification.findByIdAndUpdate(
            notificationId,
            {
                actor: noti.user,
                user: noti.actor,
                message: newMessage,
            },
            { new: true }
        ).populate('user actor interaction comment friendRequest relatedPost');

    } else {
        return null;
    }
}

const findAndRestoreNotification = async (type, objectId) => {
    const notification = await notificationService.findNotificationByTypeAndObjectId(type, objectId);
    if (notification) {
        return await notificationService.setDeletedAtNullNotificationById(notification._id);
    } else {
        return null;
    }
};

module.exports = {
    findAndSoftDeleteRelatedNotification,
    buildMessage,
    findAndUpdateMessageInNotification,
    findAndRestoreNotification,
    findAndUpdateMessageAndActorAndUserInNotification
};