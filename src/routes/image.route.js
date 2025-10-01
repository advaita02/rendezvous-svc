const express = require('express');
const router = express.Router();
const imageController = require('../controllers/image.controller');
const protect = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /images:
 *   get:
 *     summary: Get all images uploaded by the current user
 *     description: Returns a paginated list of images uploaded by the authenticated user.
 *     tags:
 *       - Images
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Page number (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         required: false
 *         description: Number of images per page (default is 12)
 *     responses:
 *       200:
 *         description: A paginated list of images
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
 *                       id:
 *                         type: string
 *                         example: "68830d259d17e1bb6aaac6ce"
 *                       url:
 *                         type: string
 *                         example: "https://rendenzvous-upload-images.s3.ap-southeast-1.amazonaws.com/1753419044985-517aaWn4wvL.jpg"
 *                       key:
 *                         type: string
 *                         example: "1753419044985-517aaWn4wvL.jpg"
 *                       description:
 *                         type: string
 *                         example: ""
 *                       uploadedBy:
 *                         type: string
 *                         example: "6833f0c726a34c61f943d359"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-25T04:50:45.287Z"
 *                       deletedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 12
 *                     totalImages:
 *                       type: integer
 *                       example: 2
 *                     hasMore:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized - Login required
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
 */
router.get('/', protect, imageController.getImagesByUserId);

module.exports = router;