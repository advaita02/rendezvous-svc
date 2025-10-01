const friendRequestService = require('../services/friendRequest.service');
const userService = require('../services/user.service');
const notificationService = require('../services/notification.service');
const Notification = require('../models/notification.model');
const { buildShortDetailUserResponse } = require('../utils/responseBuilder');
const { findAndSoftDeleteRelatedNotification, buildMessage,
    findAndUpdateMessageInNotification, findAndRestoreNotification, findAndUpdateMessageAndActorAndUserInNotification } = require('../utils/notification.utils');
const { getIO, getConnectedUsers } = require('../config/socket.config');
const { sendNotificationSSE } = require('../controllers/notification.controller');
const { buildNotificationResponse, buildFriendRequestResponse } = require('../utils/responseBuilder');


//[GET] /user/:username/friends
const getFriendsByUsername = async (req, res) => {
    try {
        const username = req.params.username;
        const user = await userService.getUserByUsername(username);

        if (!user) {
            res.status(404).json({ message: 'user not found' });
        }

        const userId = user._id;
        const friends = await friendRequestService.getFriendsByUserId(userId);

        res.json(friends.map(friend => buildShortDetailUserResponse(friend)));
    } catch (error) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

//[GET] /friends/requests
const getMyFriendRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: user not authenticated' });
        }

        const response = await friendRequestService.getFriendRequestsByUserId(userId, page, limit);

        res.json(response);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

//[POST] /friends/accept/:requestId
const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user?._id || null;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required.' });
        };

        const request = await friendRequestService.getFriendRequestByRequestId(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Friend request not found' });
        };

        if (request.toUser._id.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You are not authorized to accept this friend request.' });
        };

        if (request.status === 'accepted') {
            return res.status(409).json({ message: 'You are already friends with this user.' });
        } else if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Friend request cannot be accepted in its current state.' });
        };

        const updatedRequest = await friendRequestService.updateStatusByRequestId(request._id, 'accepted');

        //update notification
        const notification = await notificationService.findNotificationByDetails(
            updatedRequest.fromUser._id, userId, 'friendRequest', updatedRequest._id
        );
        const newMessage = await buildMessage('friendRequest', updatedRequest, userId);
        if (notification) {
            const updatedNotification = await Notification.findByIdAndUpdate(
                notification._id,
                {
                    actor: notification.user,
                    user: notification.actor,
                    message: newMessage,
                },
                { new: true }
            ).populate('user actor');

            const formatted = buildNotificationResponse(updatedNotification);
            sendNotificationSSE(updatedRequest.fromUser._id, formatted);

            // console.log(changedNoti);
        } else {
            return res.status(401).json({ message: 'Notification or User not found' });
        };

        return res.status(200).json({ message: 'Friend request accepted successfully.' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    };
};

//[POST] /friends/reject/:requestId
const rejectFriendRequest = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required.' });
        };

        const { requestId } = req.params;
        const request = await friendRequestService.getFriendRequestByRequestId(requestId);

        if (!request) {
            return res.status(404).json({ message: 'Friend request not found.' });
        };

        if (request.toUser._id.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You are not authorized to reject this friend request.' });
        };

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'This friend request has already been processed.' });
        };

        const rejectRequest = await friendRequestService.updateStatusByRequestId(request._id, 'rejected');

        //soft-delete notification
        const notification = await notificationService.findNotificationByDetails(
            request.fromUser._id,
            request.toUser._id,
            'friendRequest',
            rejectRequest._id
        );
        if (!notification) {
            return res.status(401).json({ message: 'Notification not found' });
        };
        const softDeletedNotification = await notificationService.softDeleteNotificationById(notification._id);

        return res.status(200).json({ message: 'Friend request rejected successfully.' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

//[POST] /friends/request/:userId
const sendFriendRequest = async (req, res) => {
    try {
        const fromUserId = req.user.id;
        const toUserId = req.params.userId;

        if (fromUserId.toString() === toUserId.toString()) {
            return res.status(400).json({ message: 'You cannot send a friend request to yourself.' });
        };

        const toUser = await userService.getUserById(toUserId);
        if (!toUser) {
            return res.status(404).json({ message: 'User does not exist.' });
        };

        const [existing1, existing2] = await Promise.all([
            friendRequestService.getFriendRequestByfromUserIdAndtoUserId(fromUserId, toUserId), // fromUserId -> toUserId
            friendRequestService.getFriendRequestByfromUserIdAndtoUserId(toUserId, fromUserId), // toUserId -> fromUserId
        ]);

        const status1 = existing1?.status || null;
        const status2 = existing2?.status || null;

        // if (status1 === 'pending' && existing1.deletedAt) {
        //     const request = await friendRequestService.restoreFriendRequest(existing1._id);

        //     //Restore notification by setting deletedAt: null
        //     const notification = await notificationService.findNotificationByDetails(
        //         fromUserId, toUserId, 'friendRequest', request._id);
        //     if (!notification) {
        //         return res.status(401).json({ message: 'Notification not found!' });
        //     }
        //     const restoredNoti = await notificationService.setDeletedAtNullNotificationById(notification._id);

        //     return res.status(201).json({ message: 'Friend request sent successfully.', request });
        // };

        if (status1 === 'pending' || status1 === 'accepted' || status2 === 'accepted') {
            return res.status(409).json({ message: 'Friend request already sent or you are a friend.' });
        };

        if (status2 === 'pending') {
            return res.status(409).json({ message: 'The user has already sent you a friend request.' });
        };

        if (status1 === 'rejected') {
            const request = await friendRequestService.updateStatusByRequestId(existing1._id, 'pending');
            //Create new notification
            const message = await buildMessage('friendRequest', request, fromUserId);
            const newNotification = await notificationService.addNotification(
                toUser, fromUserId, 'friendRequest', request, null, message, null
            );

            return res.status(201).json({ message: 'Friend request sent successfully.', request });
        };

        if (status2 === 'rejected') {
            // Reuse rejected friend request by reversing direction 
            const updateRequest = await friendRequestService.findAndUpdateUsersAndStatusRequestById(
                existing2._id, fromUserId, toUserId, 'pending'
            );
            console.log(updateRequest);
            //Create new notification
            const message = await buildMessage('friendRequest', request, fromUserId);
            const newNotification = await notificationService.addNotification(
                toUser, fromUserId, 'friendRequest', updateRequest, null, message, null
            );

            return res.status(201).json({ message: 'Friend request sent successfully.', updateRequest });
        };

        // No existing request, not friends
        const request = await friendRequestService.sendRequest(fromUserId, toUserId);

        //Create new notification
        const message = await buildMessage('friendRequest', request, fromUserId);
        const newNotification = await notificationService.addNotification(
            toUser, fromUserId, 'friendRequest', request, null, message, null
        );
        const formatted = buildNotificationResponse(newNotification);
        sendNotificationSSE(toUser, formatted);

        return res.status(201).json({ message: 'Friend request sent successfully.', request });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

//[POST] /friends/unfriend/:userId
const unfriend = async (req, res) => {
    try {
        const user = req.user;
        const userId = req.params.userId;

        if (!userId || !user._id) return res.status(400).json({ message: 'Missing userId or not authenticated' });

        const friendship = await friendRequestService.areFriends(userId, user._id);
        console.log(friendship);
        if (!friendship) {
            return res.status(404).json({ message: 'You are not friends' });
        };

        const rejectRequest = await friendRequestService.updateStatusByRequestId(friendship._id, 'rejected');

        if (userId.toString() == rejectRequest.toUser._id.toString()) {
            //soft-delete notification
            const notification = await notificationService.findNotificationByDetails(
                userId,
                rejectRequest.fromUser._id,
                'friendRequest',
                rejectRequest._id
            );
            if (!notification) {
                return res.status(401).json({ message: 'Notification not found' });
            };
            const softDeletedNotification = await notificationService.softDeleteNotificationById(notification._id);
            console.log(softDeletedNotification);
        } else if (userId.toString() == rejectRequest.fromUser._id.toString()) {
            //soft-delete notification
            //self
            const notification = await notificationService.findNotificationByDetails(
                rejectRequest.toUser._id.toString(), //user who accepted request of fromUser
                userId,
                'friendRequest',
                rejectRequest._id
            );
            if (!notification) {
                return res.status(401).json({ message: 'Notification not found' });
            };
            const softDeletedNotification = await notificationService.softDeleteNotificationById(notification._id);
            console.log(softDeletedNotification);

        }

        return res.status(200).json({ message: 'Unfriend successfully!' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

//[GET] /friends/my-sent-friend-requests
const getMySentFriendRequests = async (req, res) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
        return res.status(401).json({ message: 'Login required!!!' });
    }

    try {
        const mySentFriendRequests = await friendRequestService.getSentFriendRequestsOfUserId(userId, page, limit);
        return res.status(200).json(mySentFriendRequests);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

//[POST] /friends/my-sent-friend-requests/reject/:requestId
const rejectMySentFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await friendRequestService.getFriendRequestByRequestId(requestId);
        const userId = req.user?._id || null;

        if (!userId) {
            return res.status(401).json({ message: 'Login required!!!' });
        }

        if (!request) {
            return res.status(404).json({ message: 'Friend request not found' });
        } else if (request.status === 'rejected') {
            return res.status(409).json({ message: 'You have rejected this friend or this request yet!' });
        } else if (request.status === 'accepted') {
            return res.status(409).json({ message: 'This friend request has already been accepted.' });
        }

        if (userId && request.fromUser._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to cancel this friend request." });
        }

        const rejectRequest = await friendRequestService.updateStatusByRequestId(request._id, 'rejected');
        
        //soft-delete notification
        const notification = await notificationService.findNotificationByDetails(
            userId, rejectRequest.toUser._id, 'friendRequest', rejectRequest
        );
        if(!notification) {
            return res.status(401).json({ message: 'Notification not found' });
        }
        const deletedNoti = await notificationService.softDeleteNotificationById(notification._id);
        console.log(deletedNoti);
        return res.status(200).json({ message: 'Reject successfully.' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

module.exports = {
    getFriendsByUsername,
    getMyFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
    unfriend,
    getMySentFriendRequests,
    rejectMySentFriendRequest
}