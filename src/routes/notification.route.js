const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth.middleware');
const notificationController = require('../controllers/notification.controller');

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for the current user
 *     tags:
 *       - Notification
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
 *         description: Successfully retrieved notifications
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
 *                       notificationId:
 *                         type: string
 *                         example: "688c5f32e1657a9fa691f153"
 *                       actorUser:
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
 *                             example: true
 *                       type:
 *                         type: string
 *                         enum: [friendRequest, comment, interaction]
 *                         example: "friendRequest"
 *                       message:
 *                         type: string
 *                         example: "You accepted nam123's friend request."
 *                       targetId:
 *                         type: string
 *                         example: "688c5f32e1657a9fa691f150"
 *                       relatedPostId:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       interactionType:
 *                         type: string
 *                         nullable: true
 *                         enum: [like, dislike, join, null]
 *                         example: null
 *                       isRead:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-01T06:31:14.955Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-01T06:31:27.589Z"
 *                 unreadTotal:
 *                   type: integer
 *                   example: 5
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
 *                       example: 8
 *                     hasMore:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized - user not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login required!!!
 *       500:
 *         description: Internal server error
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
router.get('/', protect, notificationController.getAllNotifications);

/**
 * @swagger
 * /notifications/{notiId}/read:
 *   patch:
 *     summary: Mark a specific notification as read
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notiId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification to be marked as read
 *     responses:
 *       200:
 *         description: Notification was successfully marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 *       401:
 *         description: Unauthorized - user is not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login required.
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification not found.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error.
 *                 error:
 *                   type: string
 *                   example: Some internal error message
 */
router.patch('/:notiId/read', protect, notificationController.markNotificationAsRead);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications were successfully marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read.
 *       401:
 *         description: Unauthorized - user is not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login required.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   example: Some internal error message
 */
router.patch('/read-all', protect, notificationController.markAllNotificationsAsRead);

router.get('/:userId/stream', notificationController.streamNotifications);

module.exports = router;