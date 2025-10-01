const interactionService = require('../services/interaction.service');
const notificationService = require('../services/notification.service');
const postService = require('../services/post.service');
const userService = require('../services/user.service');
const { buildMessage } = require('../utils/notification.utils');
const { getIO, getConnectedUsers } = require('../config/socket.config');
const { sendNotificationSSE } = require('../controllers/notification.controller');
const { buildNotificationResponse } = require('../utils/responseBuilder');

// [POST] /posts/:postId/interactions
const handleInteraction = async (req, res) => {
    const userId = req.user._id;
    if (!userId) return res.status(401).json({ message: 'Not Authenticated!' });

    const { postId } = req.params;
    if (!postId) {
        return res.status(400).json({ message: 'postId is required.' });
    }

    const interactedPost = await postService.getPostById(postId);
    const { type } = req.body;

    if (!['like', 'dislike'].includes(type)) {
        return res.status(400).json({ message: 'Invalid interaction type' });
    }

    try {
        if (type === 'like') {
            const dislike = await interactionService.hasDisliked(userId, postId);
            if (dislike) {
                const updatedInteraction = await interactionService.updateInteraction(dislike, 'like');

                if (interactedPost.user._id.toString() !== userId.toString()) {
                    const message = await buildMessage('interaction', updatedInteraction, userId);
                    const notification = await notificationService.findNotificationByTypeAndObjectId('interaction', updatedInteraction);
                    const updateNotification = await notificationService.updateMessageNotificationById(message, notification._id);
                    if (notification.deletedAt) {
                        await notificationService.setDeletedAtNullNotificationById(updateNotification._id);
                    }
                }

                return res.status(200).json({ message: 'Like created', action: 'created' });
            }

            const like = await interactionService.hasLiked(userId, postId);
            if (like && !like.deletedAt) {
                const deletedInteraction = await interactionService.softDeleteInteraction(like);
                if (interactedPost.user._id.toString() !== userId.toString()) {
                    const notification = await notificationService.findNotificationByTypeAndObjectId('interaction', deletedInteraction._id);
                    await notificationService.softDeleteNotificationById(notification._id);
                }
                return res.status(200).json({ message: 'Like removed', action: 'soft_deleted' });
            } else if (like && like.deletedAt) {
                const updatedInteraction = await interactionService.setDeletedAtNullInteraction(like);
                if (interactedPost.user._id.toString() !== userId.toString()) {
                    const notification = await notificationService.findNotificationByTypeAndObjectId('interaction', updatedInteraction);
                    await notificationService.setDeletedAtNullNotificationById(notification._id);
                }
                return res.status(200).json({ message: 'Like created', action: 'created' });
            } else {
                const newInteraction = await interactionService.createInteraction(userId, postId, 'like');

                if (interactedPost.user._id.toString() !== userId.toString()) {
                    const message = await buildMessage('interaction', newInteraction, userId);
                    const newNotification = await notificationService.addNotification(
                        interactedPost.user._id,
                        userId,
                        'interaction',
                        newInteraction._id,
                        interactedPost.expiredAt,
                        message,
                        postId,
                    );

                    sendNotificationSSE(interactedPost.user._id, buildNotificationResponse(newNotification));
                }

                return res.status(201).json({ message: 'Like created', action: 'created' });
            }
        }

        if (type === 'dislike') {
            const like = await interactionService.hasLiked(userId, postId);
            if (like) {
                const updatedInteraction = await interactionService.updateInteraction(like, 'dislike');

                if (interactedPost.user._id.toString() !== userId.toString()) {
                    const message = await buildMessage('interaction', updatedInteraction, userId);
                    const notification = await notificationService.findNotificationByTypeAndObjectId('interaction', updatedInteraction);
                    const updateNotification = await notificationService.updateMessageNotificationById(message.toString(), notification._id);
                    if (notification.deletedAt) {
                        await notificationService.setDeletedAtNullNotificationById(updateNotification._id);
                    }
                }

                return res.status(200).json({ message: 'Dislike created', action: 'created' });
            }

            const dislike = await interactionService.hasDisliked(userId, postId);
            if (dislike && !dislike.deletedAt) {
                const deletedInteraction = await interactionService.softDeleteInteraction(dislike);
                if (interactedPost.user._id.toString() !== userId.toString()) {
                    const notification = await notificationService.findNotificationByTypeAndObjectId('interaction', deletedInteraction._id);
                    await notificationService.softDeleteNotificationById(notification._id);
                }
                return res.status(200).json({ message: 'Dislike removed', action: 'soft_deleted' });
            } else if (dislike && dislike.deletedAt) {
                const updatedInteraction = await interactionService.setDeletedAtNullInteraction(dislike);
                if (interactedPost.user._id.toString() !== userId.toString()) {
                    const notification = await notificationService.findNotificationByTypeAndObjectId('interaction', updatedInteraction);
                    await notificationService.setDeletedAtNullNotificationById(notification._id);
                }
                return res.status(200).json({ message: 'Dislike created', action: 'created' });
            } else {
                const newInteraction = await interactionService.createInteraction(userId, postId, 'dislike');

                if (interactedPost.user._id.toString() !== userId.toString()) {
                    const message = await buildMessage('interaction', newInteraction, userId);
                    const newNotification = await notificationService.addNotification(
                        interactedPost.user._id,
                        userId,
                        'interaction',
                        newInteraction._id,
                        interactedPost.expiredAt,
                        message,
                        postId,
                    );

                    sendNotificationSSE(interactedPost.user._id, buildNotificationResponse(newNotification));
                }

                return res.status(201).json({ message: 'Dislike created', action: 'created' });
            }
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

//[GET] /posts/:postId/interactions/users
const getInteractedUsersWithPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { type } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        if (!postId) {
            return res.status(400).json({ message: 'postId is required.' })
        };

        const validTypes = ['like', 'dislike'];

        if (type && !validTypes.includes(type)) {
            return res.status(400).json({ message: 'Invalid interaction type.' });
        };

        const post = await postService.getPostById(postId);
        const interactedUsers = await interactionService.getUsersInteractPost(post, type, page, limit);

        res.json(interactedUsers);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

module.exports = {
    handleInteraction,
    getInteractedUsersWithPost,
};