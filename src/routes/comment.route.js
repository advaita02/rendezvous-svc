const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const protect = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const commentValidation = require('../validations/comment.validation');

/**
 * @swagger
 * /comments/{commentId}/delete:
 *   post:
 *     summary: Soft delete a comment
 *     description: |
 *       Soft deletes a comment by its ID.  
 *       Requires authentication. Only the owner of the comment is allowed to delete it.
 *     tags:
 *       - Comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment deleted successfully.
 *       400:
 *         description: Missing commentId in the request
 *       403:
 *         description: You are not authorized to delete this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.post('/:commentId/delete', protect, commentController.deleteComment);

/**
 * @swagger
 * /comments/{commentId}/update:
 *   put:
 *     summary: Update a comment
 *     description: Update the content of a comment by its ID. Only the owner of the comment can update it. Requires authentication.
 *     tags:
 *       - Comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to update
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
 *                 example: "Updated comment content here!"
 *     responses:
 *       200:
 *         description: Comment updated successfully
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
 *         description: Invalid comment or missing commentId
 *       401:
 *         description: Unauthorized (not logged in)
 *       403:
 *         description: Forbidden (not the comment owner)
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.put('/:commentId/update', protect, validate(commentValidation.commentSchema), commentController.updateComment);

module.exports = router;