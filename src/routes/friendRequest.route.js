const express = require('express');
const router = express.Router();
const friendRequestController = require('../controllers/friendRequest.controller');
const protect = require('../middlewares/auth.middleware');


/**
 * @swagger
 * tags:
 *   name: FriendRequest
 *   description: Manage friend requests
 */

/**
 * @swagger
 * /friends/my-sent-friend-requests/reject/{requestId}:
 *   post:
 *     summary: Reject a sent friend request
 *     description: Allows the current user to cancel (reject) a friend request they previously sent, if it's still pending.
 *     tags: [FriendRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the friend request to reject
 *     responses:
 *       200:
 *         description: Friend request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reject successfully.
 *       401:
 *         description: Unauthorized - user must be logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login required!!!
 *       403:
 *         description: Forbidden - user is not the sender of the request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are not authorized to reject this friend request.
 *       404:
 *         description: Friend request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Friend request not found
 *       500:
 *         description: Internal server error
 */
router.post('/my-sent-friend-requests/reject/:requestId', protect, friendRequestController.rejectMySentFriendRequest);

/**
 * @swagger
 * /friends/my-sent-friend-requests:
 *   get:
 *     summary: Get list of sent friend requests (pending only)
 *     description: Returns a list of friend requests sent by the currently authenticated user that are still pending.
 *     tags: [FriendRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of sent pending friend requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       requestId:
 *                         type: string
 *                         example: 6842a3c887fd30d43fc422a6
 *                       fromUser:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             example: 684274e73063fd404d8a2ed7
 *                           username:
 *                             type: string
 *                             example: ducklings
 *                           avatar:
 *                             type: string
 *                             example: https://example.com/avt-new.jpg
 *                           isPremium:
 *                             type: boolean
 *                             example: true
 *                       toUser:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             example: 68354d48d6b5628ea1e3051e
 *                           username:
 *                             type: string
 *                             example: newuser
 *                           avatar:
 *                             type: string
 *                             example: https://example.com/avt.jpg
 *                           isPremium:
 *                             type: boolean
 *                             example: false
 *                       status:
 *                         type: string
 *                         enum: [pending, accepted, rejected]
 *                         example: pending
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-08-01T06:31:14.955Z
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-08-01T06:35:10.782Z
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 24
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - login required
 *       500:
 *         description: Internal server error
 */
router.get('/my-sent-friend-requests', protect, friendRequestController.getMySentFriendRequests);

/**
 * @swagger
 * /friends/requests:
 *   get:
 *     summary: Get friend requests sent to the current user
 *     tags: [FriendRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success – Returns the list of friend requests with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       requestId:
 *                         type: string
 *                         example: "6842a3c887fd30d43fc422a6"
 *                       fromUser:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             example: "684274e73063fd404d8a2ed7"
 *                           username:
 *                             type: string
 *                             example: "ducklings"
 *                           avatar:
 *                             type: string
 *                             example: "https://example.com/avt-new.jpg"
 *                           isPremium:
 *                             type: boolean
 *                             example: true
 *                       toUser:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             example: "68354d48d6b5628ea1e3051e"
 *                           username:
 *                             type: string
 *                             example: "newuser"
 *                           avatar:
 *                             type: string
 *                             example: "https://example.com/avt.jpg"
 *                           isPremium:
 *                             type: boolean
 *                             example: false
 *                       status:
 *                         type: string
 *                         enum: [pending, accepted, rejected]
 *                         example: "pending"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-01T06:31:14.955Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-01T06:35:10.782Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 24
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized access (not logged in)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login required!!!
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 error:
 *                   type: string
 *                   example: Error detail
 */
router.get('/requests', protect, friendRequestController.getMyFriendRequests); //list of friend requests

/**
 * @swagger
 * /friends/request/{userId}:
 *   post:
 *     summary: Send a friend request to another user
 *     tags: [FriendRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID of the user you want to send a friend request to
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Friend request sent successfully
 *       400:
 *         description: Cannot send a friend request to yourself
 *       401:
 *         description: Unauthorized access
 *       409:
 *         description: Already friends or friend request already sent
 */
router.post('/request/:userId', protect, friendRequestController.sendFriendRequest);

/**
 * @swagger
 * /friends/unfriend/{userId}:
 *   post:
 *     tags: [FriendRequest]
 *     summary: Unfriend a user
 *     description: Authenticated user unfriends another user specified by userId in path parameter.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID of the user to unfriend
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully unfriended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unfriend successfully!
 *       400:
 *         description: Missing userId or not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing userId or not authenticated
 *       404:
 *         description: Users are not friends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are not friends
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error.
 */
router.post('/unfriend/:userId', protect, friendRequestController.unfriend);

/**
 * @swagger
 * /friends/accept/{requestId}:
 *   post:
 *     summary: Accept a friend request
 *     tags: [FriendRequest]
 *     parameters:
 *       - name: requestId
 *         in: path
 *         description: ID of the friend request
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Friend request accepted successfully
 *       404:
 *         description: Friend request not found
 */
router.post('/accept/:requestId', protect, friendRequestController.acceptFriendRequest);

/**
 * @swagger
 * /friends/reject/{requestId}:
 *   post:
 *     summary: Reject a friend request
 *     tags: [FriendRequest]
 *     parameters:
 *       - name: requestId
 *         in: path
 *         description: ID of the friend request
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Friend request successfully rejected
 *       404:
 *         description: Friend request not found
 */
router.post('/reject/:requestId', protect, friendRequestController.rejectFriendRequest);

module.exports = router;