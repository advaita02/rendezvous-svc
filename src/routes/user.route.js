const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const protect = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const postController = require('../controllers/post.controller');
const friendRequestController = require('../controllers/friendRequest.controller');
const userValidation = require('../validations/user.validation');
const locationValidation = require('../validations/location.validation');
const upload = require('../middlewares/multer.middleware');

/**
 * @swagger
 * /user/getPremium:
 *   patch:
 *     summary: Activate premium for the current logged-in user
 *     description: Sets the premium status to true for the currently authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Premium activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Premium activated successfully
 *       404:
 *         description: User is not logged in
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
 *                   example: Internal server error
 *                 error:
 *                   type: string
 */
router.patch('/getPremium', protect, userController.openPremium);

/**
 * @swagger
 * /user/update-info:
 *   put:
 *     summary: Update current user information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Upload new avatar file
 *               description:
 *                 type: string
 *                 description: User's bio or self-introduction
 *               password:
 *                 type: string
 *                 description: New password (optional)
 *     responses:
 *       200:
 *         description: User information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Information has been updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "68479607b56b971d947639e9"
 *                     username:
 *                       type: string
 *                       example: "firmino"
 *                     email:
 *                       type: string
 *                       example: "firmino@gmail.com"
 *                     avatar:
 *                       type: string
 *                       format: uri
 *                       example: "https://rendenzvous-upload-images.s3.ap-southeast-1.amazonaws.com/1749613480233-ab67616d0000b273b80ea8399313aeffb10b0acb.jfif"
 *                     isPremium:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized or no permission
 */
router.put('/update-info', protect, upload.single('avatar'), validate(userValidation.updateUserSchema), userController.updateInfo);

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 example: "newuser"
 *                 description: Unique username
 *               password:
 *                 type: string
 *                 example: "123456"
 *                 description: Password (min 6 characters recommended)
 *               email:
 *                 type: string
 *                 example: "newuser@example.com"
 *                 description: Must be a valid email address
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User created"
 *       400:
 *         description: Username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Something went wrong"
 */
router.post('/register', validate(userValidation.registerSchema), userController.registerUser);

/**
 * @swagger
 * /user/near-me:
 *   get:
 *     summary: Get users near current location
 *     description: >
 *       Returns a list of nearby users based on the viewer's current location.  
 *       Requires latitude and longitude as query parameters.  
 *       Results are paginated and depend on whether the user is premium or not.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of current user location
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of current user location
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Nearby users list with pagination
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
 *                       userId:
 *                         type: string
 *                         example: 60a7b2f06f1b2c001cfb8fdf
 *                       username:
 *                         type: string
 *                         example: johndoe123
 *                       avatar:
 *                         type: string
 *                         format: uri
 *                         example: https://example.com/avatar.jpg
 *                       isPremium:
 *                         type: boolean
 *                         example: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalUser:
 *                       type: integer
 *                       example: 42
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid location format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid location format
 *       401:
 *         description: Invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/near-me', protect, userController.getUsersNearme);

/**
 * @swagger
 * /user/{username}/joined-post:
 *   get:
 *     summary: Get all posts the user has joined
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: username
 *         in: path
 *         description: Username of the user
 *         required: true
 *         schema:
 *           type: string
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
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:username/joined-post', protect, postController.getJoinedPostsByUsername); //all joined-posts

/**
 * @swagger
 * /user/{username}/posts:
 *   get:
 *     summary: Get all posts created by the user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: username
 *         in: path
 *         description: Username of the user
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         description: Page number (default is 1)
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Number of posts per page (default is 10)
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
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
 *                       example: 10
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized access
 */
router.get('/:username/posts', protect, postController.getPostsByUsername); //all posts of username

/**
 * @swagger
 * /user/{username}/friends:
 *   get:
 *     summary: Get the user's friends list
 *     tags: [User]
 *     parameters:
 *       - name: username
 *         in: path
 *         description: Username of the user
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success, returns the list of friends
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     example: "684274e73063fd404d8a2ed7"
 *                   username:
 *                     type: string
 *                     example: "ducklings"
 *                   avatar:
 *                     type: string
 *                     example: "https://example.com/avt-new.jpg"
 *                   isPremium:
 *                     type: boolean
 *                     example: false
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:username/friends', friendRequestController.getFriendsByUsername); //friends

/**
 * @swagger
 * /user/{username}:
 *   get:
 *     summary: Get detailed user information by username
 *     tags: [User]
 *     parameters:
 *       - name: username
 *         in: path
 *         description: Username of the user
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success, returns user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: "nam123"
 *                     email:
 *                       type: string
 *                       example: "nam@example.com"
 *                     description:
 *                       type: string
 *                       example: "Tài khoản test"
 *                     avatar:
 *                       type: string
 *                       example: "https://example.com/avt-new.jpg"
 *                     isPremium:
 *                       type: boolean
 *                       example: true
 *                     countPosts:
 *                       type: int
 *                       example: 5
 *                     countJoins:
 *                       type: int
 *                       example: 2
 *                     countFriends:
 *                       type: int
 *                       example: 6
 *       404:
 *         description: User not found
 */
router.get('/:username', userController.getUserByUsername); //info user


// router.put('/update-my-location', protect, validate(locationValidation.locationSchema), userController.updateMyLocation);

module.exports = router;