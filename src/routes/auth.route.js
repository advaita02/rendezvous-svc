const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const userTokenController = require('../controllers/userToken.controller');
const passport = require('passport');
const protect = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const userController = require('../controllers/user.controller');
const userValidation = require('../validations/user.validation');
const authValidation = require('../validations/auth.validation');

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many requests. Try again in 15 minutes.'
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password using verification code
 *     description: Resets the user's password after verifying their email and verification code. The code must be valid and not expired.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 description: The 6-character verification code sent to email
 *                 example: A1B2C3
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: The new password to set
 *                 example: newSecurePassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password has been reset successfully
 *       400:
 *         description: Verification failed or code expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification failed
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
router.post('/reset-password', validate(authValidation.resetPasswordSchema), authController.resetPassword);

/**
 * @swagger
 * /auth/verify-reset-code:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify password reset code
 *     description: Validates the verification code sent to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: A1B2C3
 *     responses:
 *       200:
 *         description: Verification successful
 *       400:
 *         description: Invalid or expired code
 *       500:
 *         description: Internal server error
 */
router.post('/verify-reset-code', validate(authValidation.verificationCodeSchema), authController.verifyResetCode);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request a password reset code
 *     description: Sends a 6-character verification code to the user's email. The code expires after 15 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification code has been sent to your email
 *       400:
 *         description: Invalid email format
 *       404:
 *         description: Email does not exist
 *       429:
 *         description: Too many password reset requests
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', validate(authValidation.emailResetPasswordSchema),
    forgotPasswordLimiter, authController.forgotPassword);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username or email
 *                 example: "johndoe" 
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60a7cfe4..."
 *                     username:
 *                       type: string
 *                       example: "johndoe"
 *                     email:
 *                       type: string
 *                       example: "johndoe@example.com"
 *                     avatar:
 *                       type: string
 *                       example: "example.com/image/7120380123"
 *                     isPremium:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Missing identifier or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Username/email and password are required"
 *       401:
 *         description: Invalid credentials (username/email or password incorrect)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid username/email"
 *       500:
 *         description: Internal server error
 */
router.post('/login', validate(userValidation.loginSchema), authController.loginUser);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     description: Logout user by clearing refresh token stored in cookies.
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       400:
 *         description: Refresh token is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Refresh token is required
 *       404:
 *         description: Token not found or already logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token not found or already logged out
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */
router.post('/logout', userTokenController.logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token from cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Access token successfully issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: "newAccessToken123abc"
 *       400:
 *         description: Refresh token is required (not found in cookies)
 *       401:
 *         description: Invalid or expired refresh token
 *       403:
 *         description: Refresh token is expired or invalid
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /auth/current-user:
 *   post:
 *     summary: Get the current user's information from the accessToken
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the current user's information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   example: "123bei12i3u1bfv12312..."
 *                 username:
 *                   type: string
 *                   example: "nam123"
 *                 email:
 *                   type: string
 *                   example: "nam@example.com"
 *                 avatar:
 *                   type: string
 *                   example: "https://example.com/avt-new.jpg"
 *                 isPremium:
 *                   type: boolean
 *                   example: true
 *                 description:
 *                   type: string
 *                   example: "Test account"
 *       401:
 *         description: Unauthorized - Invalid or expired access token
 */
router.post('/current-user', protect, userController.getCurrentUser)

//oauth2 google
router.get('/oauth2/callback/google',
    passport.authenticate('google', { failureRedirect: '/auth/login', session: false }),
    authController.providerCallback
);
router.get('/oauth2/authorize/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

//oauth2 facebook
router.get('/oauth2/callback/facebook',
    passport.authenticate('facebook', { session: false }),
    authController.providerCallback
);
router.get('/oauth2/authorize/facebook', passport.authenticate('facebook'));

module.exports = router;