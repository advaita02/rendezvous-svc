const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const participantController = require('../controllers/participant.controller');
const protect = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const postValidation = require('../validations/post.validation');
const commentValidation = require('../validations/comment.validation');
const interactionController = require('../controllers/interaction.controller');
const commentController = require('../controllers/comment.controller');
const validate = require('../middlewares/validate.middleware');

// /**
//  * @swagger
//  * /posts/{postId}/participants/self:
//  *   delete:
//  *     summary: Cancel the current user's join request for a post
//  *     description: Cancels the current user's join request for the given post and soft deletes the related notification if it exists.
//  *     tags:
//  *       - Participants
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: postId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The ID of the post.
//  *     responses:
//  *       200:
//  *         description: Join request cancelled successfully.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Join cancelled
//  *                 action:
//  *                   type: string
//  *                   example: soft_deleted
//  *       404:
//  *         description: Join request not found.
//  *       500:
//  *         description: Internal server error.
//  */
// router.delete('/:postId/participants/self', protect, participantController.cancelJoin);

/**
 * @swagger
 * /posts/{postId}/participants:
 *   post:
 *     summary: Toggle join request to a post
 *     description: |
 *       Toggles the user's join status for a post:
 *       - If no join request exists, it creates one (pending).
 *       - If a cancelled request exists, it restores it.
 *       - If an active request exists (pending or approved), it cancels it (soft delete).
 *     tags:
 *       - Participants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to join or cancel join.
 *     responses:
 *       200:
 *         description: Join request toggled (restored or cancelled).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Join restored
 *                 action:
 *                   type: string
 *                   enum: [restored, cancelled]
 *                   example: restored
 *       201:
 *         description: New join request created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Join request sent
 *                 action:
 *                   type: string
 *                   example: pending
 *                 data:
 *                   type: object
 *                   description: Participant details
 *                   properties:
 *                     participantId:
 *                       type: string
 *                       example: 64b6f0192e4f5d001c8d1234
 *                     postId:
 *                       type: string
 *                       example: 64b6e9f12e4f5d001c8d5678
 *                     status:
 *                       type: string
 *                       enum: [pending, approved, rejected, cancelled]
 *                       example: pending
 *                     joinedAt:
 *                       type: string
 *                       format: date-time
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     user:
 *                       type: object
 *                       description: Short user details
 *       400:
 *         description: Post is full, post has expired, or invalid request.
 *       401:
 *         description: Unauthorized - user not authenticated.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/:postId/participants', protect, participantController.joinPost);

/**
 * @swagger
 * /posts/{postId}/participants:
 *   get:
 *     summary: Get participants of a post by status
 *     description: |
 *       Retrieves participants for a given post filtered by status with pagination.  
 *       - **approved**: Publicly viewable by anyone (no login required).  
 *       - **pending** and **rejected**: Only the post owner can view.  
 *     tags:
 *       - Participants
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post.
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Participant status to filter by.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Number of items per page.
 *     responses:
 *       200:
 *         description: List of participants matching the given status.
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
 *                       participantId:
 *                         type: string
 *                         example: "689c2544523c5b26bf4349d9"
 *                       postId:
 *                         type: string
 *                         example: "689c19d09f9606756f264df7"
 *                       status:
 *                         type: string
 *                         example: "rejected"
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-13T05:40:20.512Z"
 *                       deletedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       user:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             example: "6890b2dff8b0719b5f2e8461"
 *                           username:
 *                             type: string
 *                             example: "newuser00"
 *                           avatar:
 *                             type: string
 *                             example: "https://example.com/avt.jpg"
 *                           isPremium:
 *                             type: boolean
 *                             example: false
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPost:
 *                       type: integer
 *                       example: 1
 *                     hasMore:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Login required (only for pending/rejected statuses).
 *       403:
 *         description: Not allowed to view these participants (only for pending/rejected statuses).
 *       404:
 *         description: Post not found or expired.
 *       422:
 *         description: Invalid status value.
 *       500:
 *         description: Internal server error.
 */
router.get('/:postId/participants', protect, participantController.getParticipants);

/**
 * @swagger
 * /posts/{postId}/join-status:
 *   get:
 *     summary: Get current user's join status for a post
 *     description: |
 *       Returns the current user's participation status for the given post.  
 *       - **not_joined**: User has never joined or their join record has been deleted.  
 *       - **pending**: Waiting for approval.  
 *       - **approved**: Approved to join.  
 *       - **rejected**: Rejected by post owner.  
 *       - **cancelled**: User cancelled their join request.
 *     tags:
 *       - Participants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post.
 *     responses:
 *       200:
 *         description: Participation status found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [not_joined, pending, approved, rejected, cancelled]
 *                   example: not_joined
 *             example:
 *               status: "approved"
 *       400:
 *         description: "Missing required parameter: postId."
 *       401:
 *         description: Login required.
 *       500:
 *         description: Internal server error.
 */
router.get('/:postId/join-status', protect, participantController.getCurrentUserJoinStatus);

/**
 * @swagger
 * /posts/{postId}/update:
 *   put:
 *     summary: Update a post
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The new content of the post
 *                 example: Updated post content here
 *               privacy:
 *                 type: string
 *                 enum: [public, friend]
 *                 description: Privacy level
 *                 example: public
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 new images to replace the current ones
 *               oldImages:
 *                 type: string
 *                 description: A string representing image URLs to keep, separated by commas and wrapped in curly braces
 *                 example: "{https://s3.amazonaws.com/bucket/img1.jpg,https://s3.amazonaws.com/bucket/img2.jpg}"
 *               location:
 *                 type: string
 *                 description: 'Location data as a JSON string.'
 *                 example: '{"latitude":21.03,"longitude":105.81}'
 *               locationName:
 *                 type: string
 *                 description: location name
 *                 example: Phu my hung
 *               address:
 *                 type: string
 *                 description: address
 *                 example: Phu my hung
 *               type:
 *                 type: string
 *                 description: type
 *                 example: street
 *               category:
 *                 type: string
 *                 description: category
 *                 example: city
 *               maxParticipants:
 *                 type: integer
 *                 description: max participants
 *                 example: 5
 *                 default: 5
 *     responses:
 *       '200':
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postId:
 *                   type: string
 *                   example: 684be7413260bb41b6eff0b2
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: 68479607b56b971d947639e9
 *                     username:
 *                       type: string
 *                       example: firmino
 *                     avatar:
 *                       type: string
 *                       format: uri
 *                       example: https://rendenzvous-upload-images.s3.ap-southeast-1.amazonaws.com/avatar.jpg
 *                 content:
 *                   type: string
 *                   example: update content
 *                 imageUrls:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 *                 privacy:
 *                   type: string
 *                   example: friend
 *                 location:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: Point
 *                     coordinates:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [106.7, 10.8]
 *                 selectedLocation:
 *                   type: object
 *                   properties:
 *                     locationName:
 *                       type: string
 *                       example: Phu my hung
 *                     address:
 *                       type: string
 *                       example: Phu my hung, TPHCM
 *                     type:
 *                       type: string
 *                       example: street
 *                     category:
 *                       type: string
 *                       example: city
 *                 expiredAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-06-13T09:54:25.196Z
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-06-13T08:54:25.199Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-06-13T08:54:25.199Z
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Privacy must be either 'public' or 'friend'
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Post not found or Post is expired!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post not found or Post is expired!
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */
router.put('/:postId/update', protect, upload.array('images', 5),
    validate(postValidation.updatePostSchema), postController.updatePost);

/**
 * @swagger
 * /posts/{postId}/delete:
 *   delete:
 *     summary: Soft delete a post
 *     description: Marks a post as deleted by setting its deletedAt field. Only the post's owner can delete it.
 *     tags:
 *       - Post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to delete
 *     responses:
 *       200:
 *         description: Post soft-deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post soft-deleted successfully
 *       400:
 *         description: Invalid request (e.g. post already deleted or missing ID)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post already deleted
 *       403:
 *         description: Forbidden – not the owner of the post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You cannot delete a post of another user!
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:postId/delete', protect, postController.deletePost);

/**
 * @swagger
 * /posts/{postId}/interactions:
 *   post:
 *     summary: Toggle interaction on a post
 *     description: |
 *       Create or soft-delete an interaction (`like`, `dislike`, or `join`) by the authenticated user on a specific post.
 *       
 *       - If `type` is `join`: the user will either join or unjoin the post.
 *       - If `type` is `like`: if the user has already disliked, it will switch to like; otherwise, it will create or remove the like.
 *       - If `type` is `dislike`: if the user has already liked, it will switch to dislike; otherwise, it will create or remove the dislike.
 *     tags:
 *       - Interaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to interact with
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [like, dislike, join]
 *                 example: like
 *                 description: The type of interaction to perform
 *     responses:
 *       200:
 *         description: Interaction toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Like removed
 *                 action:
 *                   type: string
 *                   enum: [created, soft_deleted]
 *                   example: soft_deleted
 *       201:
 *         description: Interaction created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Join created
 *                 action:
 *                   type: string
 *                   enum: [created]
 *                   example: created
 *       400:
 *         description: Invalid interaction type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid interaction type
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid token or No token provided
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
 */
router.post('/:postId/interactions', protect, interactionController.handleInteraction);

/**
 * @swagger
 * /posts/{postId}/comment:
 *   post:
 *     summary: Add a comment to a post
 *     description: |
 *       Add a new comment to a specific post. Requires authentication.
 *       
 *       The comment must:
 *       - Be a non-empty string
 *       - Have a maximum length of 1000 characters
 *     tags:
 *       - Comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *                 minLength: 1
 *                 example: "This is a comment"
 *                 description: Comment content (1–1000 characters)
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 commentId:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     username:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *                     isPremium:
 *                       type: boolean
 *                 content:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request — missing postId or invalid comment (empty or too long)
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.post('/:postId/comment', protect, validate(commentValidation.commentSchema), commentController.commentPost);

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     description: Create a post with content, images (maximum 5), privacy setting, and location.
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Content of the post
 *                 example: Test post
 *               privacy:
 *                 type: string
 *                 description: Privacy setting of the post
 *                 enum: [public, friend]
 *                 example: public
 *               location:
 *                 type: string
 *                 description: 'Location data as a JSON string.'
 *                 example: '{"latitude":21.03,"longitude":105.81}'
 *               locationName:
 *                 type: string
 *                 description: location name
 *                 example: Phu my hung
 *               address:
 *                 type: string
 *                 description: address
 *                 example: Phu my hung
 *               type:
 *                 type: string
 *                 description: type
 *                 example: street
 *               category:
 *                 type: string
 *                 description: type
 *                 example: city
 *               maxParticipants:
 *                 type: integer
 *                 description: max participants
 *                 example: 5
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: List of images (maximum 5)
 *     responses:
 *       '200':
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postId:
 *                   type: string
 *                   example: 684be7413260bb41b6eff0b2
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: 68479607b56b971d947639e9
 *                     username:
 *                       type: string
 *                       example: firmino
 *                     avatar:
 *                       type: string
 *                       format: uri
 *                       example: https://rendenzvous-upload-images.s3.ap-southeast-1.amazonaws.com/avatar.jpg
 *                 content:
 *                   type: string
 *                   example: update content
 *                 imageUrls:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 *                 privacy:
 *                   type: string
 *                   example: friend
 *                 location:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: Point
 *                     coordinates:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [106.7, 10.8]
 *                 selectedLocation:
 *                   type: object
 *                   properties:
 *                     locationName:
 *                       type: string
 *                       example: Phu my hung
 *                     address:
 *                       type: string
 *                       example: Phu my hung, TPHCM
 *                     type:
 *                       type: string
 *                       example: street
 *                     category:
 *                       type: string
 *                       example: city
 *                     privacy:
 *                       type: integer
 *                       example: 5
 *                 expiredAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-06-13T09:54:25.196Z
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-06-13T08:54:25.199Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-06-13T08:54:25.199Z
 *       '400':
 *         description: Invalid data or too many images uploaded
 *       '500':
 *         description: Internal server error
 */
router.post('/', protect, upload.array('images', 5),
    validate(postValidation.createPostSchema), postController.createPost);

/**
 * @swagger
 * /posts/{postId}/interactions/users:
 *   get:
 *     summary: Get the list of users who interacted with a post
 *     tags:
 *       - Interaction
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [like, dislike, join]
 *         description: Optional. Type of interaction to filter (like, dislike, join). If not provided, all interaction types will be returned.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (for pagination)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of users who interacted with the post with pagination metadata
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
 *                       user:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           username:
 *                             type: string
 *                           avatar:
 *                             type: string
 *                           isPremium:
 *                             type: boolean
 *                       type:
 *                         type: string
 *                         description: The type of interaction
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       400:
 *         description: Bad request (invalid postId or interaction type)
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.get('/:postId/interactions/users', interactionController.getInteractedUsersWithPost);

/**
 * @swagger
 * /posts/{postId}:
 *   get:
 *     summary: Get post by ID
 *     description: Retrieve a single post by its unique ID.
 *     tags:
 *       - Post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved the post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postId:
 *                   type: string
 *                   example: 68872a1cf00f3d37b40db9a9
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: 6833f0c726a34c61f943d359
 *                     username:
 *                       type: string
 *                       example: nam123
 *                     avatar:
 *                       type: string
 *                       format: uri
 *                       example: https://example.com/avt-new.jpg
 *                 content:
 *                   type: string
 *                   example: test delete image
 *                 imageUrls:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 *                   example:
 *                     - https://rendenzvous-upload-images.s3.ap-southeast-1.amazonaws.com/1753688685980-6f84a070-1cb6-4456-b013-e1d8147921e3-Louis_Armstrong_What_a_Wonderful_World.jpg
 *                 privacy:
 *                   type: string
 *                   enum: [public, friend]
 *                   example: public
 *                 location:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: Point
 *                     coordinates:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [106.70231795378746, 10.721366511884659]
 *                 selectedLocation:
 *                   type: object
 *                   properties:
 *                     locationName:
 *                       type: string
 *                       example: Phu my hung
 *                     address:
 *                       type: string
 *                       example: phuong sai gon, tphcm
 *                     type:
 *                       type: string
 *                       example: street
 *                     category:
 *                       type: string
 *                       example: city
 *                 expiredAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-07-28T10:43:24.596Z
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-07-28T07:43:24.599Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-07-28T07:46:26.306Z
 *       400:
 *         description: Missing or invalid post ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post ID is required
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post not found
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
 *                   example: Something went wrong
 */
router.get('/:postId', postController.getPostById);

/**
 * @swagger
 * /posts/{postId}/comments:
 *   get:
 *     summary: Retrieve paginated comments for a specific post
 *     description: |
 *       Returns a paginated list of comments associated with a specific post.
 *       Results are ordered by newest first.
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to retrieve comments for
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination (default is 1)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of comments per page (default is 10)
 *     responses:
 *       200:
 *         description: List of comments for the post
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
 *                       commentId:
 *                         type: string
 *                         example: "66706b9e4182b859a0e6d0d1"
 *                       content:
 *                         type: string
 *                         example: "Oke, let's goooo!"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-06-18T13:45:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-06-18T13:50:00.000Z"
 *                       user:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             example: "665f7d8b278c0d5e1a7e4d29"
 *                           username:
 *                             type: string
 *                             example: "user123"
 *                           avatar:
 *                             type: string
 *                             example: "https://example.com/avatar.jpg"
 *                           isPremium:
 *                             type: boolean
 *                             example: false
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
 *                       example: 5
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid postId
 *       500:
 *         description: Server error
 */
router.get('/:postId/comments', commentController.getCommentsByPostId);

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Retrieve a list of visible posts for the current user
 *     description: |
 *       Returns posts visible to the current user based on privacy settings and optional location filtering.
 *       - If query parameters `latitude` and `longitude` are provided, the result will be filtered by distance.
 *       - Supports pagination using `page` and `limit` query parameters.
 *       - Supports category filtering using `category`, following HERE Maps category codes.
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         required: false
 *         description: Latitude of the viewer’s location
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         required: false
 *         description: Longitude of the viewer’s location
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: Page number for pagination (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         required: false
 *         description: Number of posts per page (default is 20)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         required: false
 *         description: |
 *           HERE Maps category ID used to filter posts by location type.  
 *           - Example Level 1 categories:  
 *             - `100` = Eat & Drink  
 *             - `200` = Going Out – Entertainment  
 *             - `300` = Sights & Museums  
 *             - `550` = Leisure & Outdoor  
 *             - `600` = Shopping  
 *           - Example full category: `100-1100-0000` (Restaurants)  
 *           If only the first level (e.g. `100`) is provided, all subcategories will be matched.
 *     responses:
 *       200:
 *         description: List of visible posts
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
 *                       postId:
 *                         type: string
 *                         example: "6669b2381a09f83b4b1bbee1"
 *                       user:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             example: "665f7d8b278c0d5e1a7e4d29"
 *                           username:
 *                             type: string
 *                             example: "cutehotme"
 *                           avatar:
 *                             type: string
 *                             example: "https://example.com/avt.jpg"
 *                           isPremium:
 *                             type: boolean
 *                             example: false
 *                       content:
 *                         type: string
 *                         example: "Xin chào!"
 *                       imageUrls:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["https://example.com/image1.jpg"]
 *                       privacy:
 *                         type: string
 *                         enum: [public, friend]
 *                         example: "public"
 *                       location:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: "Point"
 *                           coordinates:
 *                             type: array
 *                             items:
 *                               type: number
 *                             example: [106.70231795378746, 10.721366511884659]
 *                       selectedLocation:
 *                         type: object
 *                         properties:
 *                           locationName:
 *                             type: string
 *                             example: "Phu my hung"
 *                           address:
 *                             type: string
 *                             example: "phuong sai gon, tphcm"
 *                           type:
 *                             type: string
 *                             example: "street"
 *                           category:
 *                             type: string
 *                             example: "100-1100-0000"
 *                       expiredAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-06-30T12:00:00.000Z"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-06-09T14:01:23.456Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-06-09T14:01:23.456Z"
 *                       interactions:
 *                         type: object
 *                         properties:
 *                           like:
 *                             type: integer
 *                             example: 4
 *                           dislike:
 *                             type: integer
 *                             example: 0
 *                           join:
 *                             type: integer
 *                             example: 2
 *                       comments:
 *                         type: integer
 *                         example: 8
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     totalPost:
 *                       type: integer
 *                       example: 100
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       500:
 *         description: Server error
 */
router.get('/', protect, postController.getAllPosts);


module.exports = router;