const Participant = require('../models/participant.model');
const participantService = require('../services/participant.service');
const postService = require('../services/post.service');
const notificationService = require('../services/notification.service');
const { buildParticipantResponse } = require('../utils/responseBuilder');
const { buildMessage } = require('../utils/notification.utils');

// [TODO] handle notifications in each function. 
// [UPDATE]: Completed, but not yet tested.

// [GET] /posts/:postId/participants
const getParticipants = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { postId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(422).json({ message: 'Invalid status value' });
        }

        const post = await postService.getPostById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found or expired!' });
        }

        if (status !== 'approved') {
            if (!userId) {
                return res.status(401).json({ message: 'Login required!' });
            }
            if (post.user._id.toString() !== userId.toString()) {
                return res.status(403).json({ message: "You are not allowed to see join requests for this post." });
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const totalParticipants = await participantService.countParticipantsByPostIdAndStatus(postId, status);

        const participants = await participantService.getParticipantsByPostIdAndStatusPaginated(
            postId, status, skip, parseInt(limit)
        );

        res.json({
            data: participants.map(participant => buildParticipantResponse(participant)),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPost: totalParticipants,
                hasMore: parseInt(page) * parseInt(limit) < totalParticipants
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// [GET] /posts/:postId/join-status
const getCurrentUserJoinStatus = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Login required.' });
        }

        const { postId } = req.params;
        if (!postId) {
            return res.status(400).json({ message: 'Missing required parameter: postId' });
        }
        // Find participant that has not been soft-deleted (deletedAt = null)
        const participant = await participantService.findParticipantByPostIdUserId(postId, userId);

        if (!participant || participant.deletedAt) {
            return res.status(200).json({ status: 'not_joined' });
        }

        return res.status(200).json({ status: participant.status });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// // [POST] /posts/:postId/participants
// const joinPost = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         if (!userId) {
//             return res.status(401).json({ message: 'Login required!' });
//         };

//         const { postId } = req.params;
//         if (!postId) {
//             return res.status(400).json({ message: 'Missing required parameter: postId' });
//         };

//         const post = await postService.getPostById(postId);
//         if (!post) return res.status(404).json({ message: 'Post not found.' });

//         if (post.expiredAt && post.expiredAt < new Date()) {
//             return res.status(400).json({ message: 'Post has expired.' });
//         };

//         // Find participant that has not been soft-deleted (deletedAt = null)
//         const existing = await participantService.findParticipantByPostIdUserId(postId, userId);
//         if (existing) {
//             if (existing.status == 'pending' || existing.status == 'approved') {
//                 return res.status(400).json({ message: 'Already approved or pending' });
//             } else if (existing.status == 'cancelled') {
//                 existing.deletedAt = null;
//                 existing.status = 'pending';
//                 await existing.save();

//                 const noti = await notificationService.findDeletedNotificationByDetails(userId, post.user._id, 'participant', existing._id);

//                 if (noti) {
//                     await notificationService.setDeletedAtNullNotificationById(noti._id);
//                 }

//                 return res.status(201).json({ message: 'Join request restored', action: 'restored' });
//             }
//         };

//         const approvedCount = await participantService.countApprovedParticipantByPostId(postId);

//         if (post.maxParticipants !== null && approvedCount >= post.maxParticipants) {
//             return res.status(400).json({ message: 'Post is full' });
//         }

//         const pendingParticipant = await participantService.createPendingParticipantByPostIdUserId(postId, userId);
//         console.log(pendingParticipant._id);
//         const message = await buildMessage('participant', pendingParticipant, userId);
//         await notificationService.addNotification(
//             post.user._id, //received user
//             userId, //actor
//             'participant',
//             pendingParticipant._id,
//             post.expiredAt,
//             message,
//             postId
//         );

//         return res.status(201).json({
//             message: 'Join request sent',
//             action: 'pending',
//             data: buildParticipantResponse(pendingParticipant)
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: 'Internal server error', error: err.message });
//     }
// };

// [POST] /posts/:postId/participants
const joinPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;

        if (!userId) return res.status(401).json({ message: 'Login required!' });
        if (!postId) return res.status(400).json({ message: 'Missing postId' });

        const post = await postService.getPostById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found.' });
        if (post.expiredAt && post.expiredAt < new Date()) {
            return res.status(400).json({ message: 'Post has expired.' });
        }

        if (post.user._id.toString() === userId.toString()) {
            return res.status(400).json({ message: 'You cannot send a join request to your own post.' });
        }

        const existing = await participantService.findParticipantByPostIdUserId(postId, userId);

        if (existing) {
            if (existing.status === 'rejected') {
                return res.status(400).json({ message: 'You have been rejected from this post.' });
            }

            if (existing.status === 'cancelled') {
                const approvedCount = await participantService.countApprovedParticipantByPostId(postId);
                if (post.maxParticipants !== null && approvedCount >= post.maxParticipants) {
                    return res.status(400).json({ message: 'Post is full' });
                }

                existing.deletedAt = null;
                existing.status = 'pending';
                await existing.save();
                await existing.populate('post');

                const message = await buildMessage('participant', existing, userId);
                await notificationService.addNotification(
                    post.user._id, userId, 'participant',
                    existing._id, post.expiredAt,
                    message, postId
                );

                return res.status(200).json({ message: 'Join restored', action: 'restored' });
            }

            if (existing.status === 'pending' || existing.status === 'approved') {
                existing.status = 'cancelled';
                await existing.save();

                const pendingNoti = await notificationService.findNotificationByDetails(
                    userId, post.user._id, 'participant', existing._id
                );
                if (pendingNoti) {
                    await notificationService.softDeleteNotificationById(pendingNoti._id);
                }

                const approvedNoti = await notificationService.findNotificationByDetails(
                    post.user._id, userId, 'participant', existing._id
                );
                if (approvedNoti) {
                    await notificationService.softDeleteNotificationById(approvedNoti._id);
                }

                return res.status(200).json({ message: 'Join cancelled', action: 'cancelled' });
            }
        }

        const approvedCount = await participantService.countApprovedParticipantByPostId(postId);
        if (post.maxParticipants !== null && approvedCount >= post.maxParticipants) {
            return res.status(400).json({ message: 'Post is full' });
        }

        const pendingParticipant = await participantService.createPendingParticipantByPostIdUserId(postId, userId);
        const message = await buildMessage('participant', pendingParticipant, userId);
        await notificationService.addNotification(
            post.user._id, userId, 'participant',
            pendingParticipant._id, post.expiredAt,
            message, postId
        );

        return res.status(201).json({
            message: 'Join request sent',
            action: 'pending',
            data: buildParticipantResponse(pendingParticipant)
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};


// // [DELETE] /posts/:postId/participants/self
// const cancelJoin = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const { postId } = req.params;

//         // Find participant that has not been soft-deleted (deletedAt = null)
//         const participant = await participantService.findParticipantByPostIdUserId(postId, userId);
//         if (!participant && participant.deletedAt) {
//             return res.status(404).json({ message: 'Join request not found' });
//         }
//         participant.status = 'cancelled';
//         await participant.save();

//         const pendingNoti = await notificationService.findNotificationByDetails(
//             userId, //actor
//             participant.post.user._id,
//             'participant',
//             participant._id
//         );
//         console.log(pendingNoti);
//         if (pendingNoti) {
//             await notificationService.softDeleteNotificationById(noti._id);
//         }

//         const approvedNoti = await notificationService.findNotificationByDetails(
//             participant.post.user._id, //actor
//             userId,
//             'participant',
//             participant._id
//         );
//         console.log(approvedNoti);
//         if (approvedNoti) {
//             await notificationService.softDeleteNotificationById(noti._id);
//         }

//         return res.status(200).json({ message: 'Join cancelled', action: 'soft_deleted' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: 'Internal server error', error: err.message });
//     }
// };

// [GET] /participants/:participantId
const getParticipantById = async (req, res) => {
    try {
        const participantId = res.params.participantId;
        const participant = await participantService.getParticipantById(participantId);
        res.json(buildParticipantResponse(participant));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// [PATCH] /participants/:participantId
const updateParticipantStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { participantId } = req.params;
        const { status } = req.body;

        const validStatuses = ['approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(422).json({ message: 'Invalid status value' });
        };

        // Find participant including soft-deleted records (no deletedAt filter)
        const participant = await participantService.findParticipantById(participantId);
        if (!participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        if (status === participant.status) {
            return res.status(400).json({ message: `Participant already ${status}` });
        }

        // if (participant.post.expiredAt && participant.post.expiredAt < new Date()) {
        //     return res.status(400).json({ message: 'Post has expired.' });
        // };

        if (participant.post.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not allowed to update this participant." });
        }

        if (status === 'approved') {
            const approvedCount = await participantService.countApprovedParticipantByPostId(participant.post._id);
            if (participant.post.maxParticipants !== null && approvedCount >= participant.post.maxParticipants) {
                return res.status(400).json({ message: 'Post is full' });
            };
        }

        const oldStatus = participant.status;

        participant.status = status;
        const updated = await participant.save();

        const message = await buildMessage('participant', updated, userId);
        if (oldStatus === 'pending') {
            const pendingNotification = await notificationService.findNotificationByDetails(
                participant.user._id,
                userId,
                'participant',
                participant._id,
            );
            if (pendingNotification) {
                // Swap direction so that the original requester (participant.user) receives the notification
                // user  = notification receiver
                // actor = the one performing the action (approve / reject)
                pendingNotification.user = participant.user; // original join request sender
                pendingNotification.actor = userId; // post owner
                pendingNotification.message = message;
                await pendingNotification.save();
            }
        } else {
            const notification = await notificationService.findNotificationByDetails(
                userId,
                participant.user._id,
                'participant',
                participant,
            );
            notification.message = message;
            await notification.save();
        }

        return res.status(200).json({
            message: `Participant ${status}`,
            action: status,
            data: buildParticipantResponse(updated)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

module.exports = {
    joinPost,
    getParticipants,
    updateParticipantStatus,
    getCurrentUserJoinStatus,
    getParticipantById,
};
