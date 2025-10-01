const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participant.controller');
const protect = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /participants/{participantId}:
 *   patch:
 *     summary: Update participant status
 *     description: |
 *       Allows the **post owner** to approve or reject a participant's join request.  
 *       - Only the post owner has permission to perform this action.  
 *       - If the post has expired or has reached the maximum participant limit, the request will be rejected.  
 *       - Related notifications will also be updated accordingly.
 *     tags:
 *       - Participants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: participantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the participant to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: The new status for the participant.
 *             example:
 *               status: approved
 *     responses:
 *       200:
 *         description: Participant status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Participant approved
 *                 action:
 *                   type: string
 *                   example: approved
 *                 data:
 *                   type: object
 *                   properties:
 *                     participantId:
 *                       type: string
 *                       example: "64d5f87b9b1d2e001e9e4567"
 *                     postId:
 *                       oneOf:
 *                         - type: string
 *                           example: "64cfe4e6a19cde001f9c1234"
 *                         - type: object
 *                           description: Post details if populated
 *                     status:
 *                       type: string
 *                       enum: [pending, approved, rejected]
 *                       example: approved
 *                     joinedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-10T14:23:00.000Z"
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *                     user:
 *                       type: object
 *                       description: Short user details
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: "64cfe4e6a19cde001f9c5678"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         avatar:
 *                           type: string
 *                           example: "https://example.com/avatar.jpg"
 *       400:
 *         description: 
 *           - Participant already in the requested status.  
 *           - Post has expired.  
 *           - Post is full.
 *       403:
 *         description: Not allowed to update this participant.
 *       404:
 *         description: Participant not found.
 *       422:
 *         description: Invalid status value (must be `approved` or `rejected`).
 *       500:
 *         description: Internal server error.
 */
router.patch('/:participantId', protect, participantController.updateParticipantStatus);


module.exports = router;