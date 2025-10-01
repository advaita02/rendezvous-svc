const commentService = require('../services/comment.service');
const notificationService = require('../services/notification.service');
const userService = require('../services/user.service');
const { buildCommentResponse } = require('../utils/responseBuilder');
const { findAndSoftDeleteRelatedNotification, buildMessage } = require('../utils/notification.utils');
const { getIO, getConnectedUsers } = require('../config/socket.config');
const { sendNotificationSSE } = require('../controllers/notification.controller');
const { buildNotificationResponse } = require('../utils/responseBuilder');

//[POST] /comments/:commentId/delete
const deleteComment = async (req, res) => {
    const userId = req.user?._id || null;
    if (!userId) {
        return res.status(401).json({ message: 'Login required!!!' });
    }
    const commentId = req.params.commentId;
    if (!commentId) return res.status(400).json({ commentId: 'postId is required.' });
    try {
        const comment = await commentService.findCommentByCommentId(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        if (comment.user._id.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can not delete a comment of other user.' });
        }
        await commentService.softDeleteComment(comment);

        // soft-delete related notification
        await findAndSoftDeleteRelatedNotification('comment', commentId);

        res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

//[PUT] /comments/:commentId/update
const updateComment = async (req, res) => {
    const userId = req.user?._id || null;
    if (!userId) {
        return res.status(401).json({ message: 'Login required!!!' });
    }

    const commentId = req.params.commentId;
    const content = req.body.content;
    if (!commentId) return res.status(400).json({ commentId: 'postId is required.' });
    try {
        const comment = await commentService.findCommentByCommentId(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        if (comment.user._id.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can not update a comment of other user.' });
        }
        const updatedComment = await commentService.updateComment(comment, content);
        res.status(200).json(buildCommentResponse(updatedComment));
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

//[POST] /posts/:postId/comment
const commentPost = async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json({ message: 'Login required!!!' });
    };
    const user = await userService.getUserById(userId);

    const postId = req.params.postId;
    if (!postId) return res.status(400).json({ message: 'postId is required.' });

    const content = req.body.content;

    try {
        const commented = await commentService.addCommentAtPostIdByUserId(postId, userId, content);
        const response = buildCommentResponse(commented);

        const actorId = userId;
        const receivedUserId = commented.post.user._id;

        const message = await buildMessage('comment', commented, actorId);

        if (actorId.toString() !== receivedUserId.toString()) {
            const newNotification = await notificationService.addNotification(
                receivedUserId,
                actorId,
                'comment',
                commented,
                commented.post.expiredAt,
                message,
                postId,
            );

            sendNotificationSSE(receivedUserId, buildNotificationResponse(newNotification));
        }

        res.status(201).json(response);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

const getCommentsByPostId = async (req, res) => {
    try {
        const postId = req.params.postId;
        if (!postId) {
            return res.status(400).json({ message: 'postId is required!' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const { comments, total } = await commentService.getCommentsByPostId(postId, page, limit);

        const hasMore = page * limit < total;

        res.status(200).json({
            data: comments.map(buildCommentResponse),
            pagination: {
                page,
                limit,
                total,
                hasMore,
            },
        });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};


module.exports = {
    getCommentsByPostId,
    commentPost,
    deleteComment,
    updateComment,
}