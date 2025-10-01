const express = require('express');
const router = express.Router();

const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const postRoutes = require('./post.route');
const friendRoutes = require('./friendRequest.route');
const commentRoutes = require('./comment.route');
const notificationRoutes = require('./notification.route');
const placeRoutes = require('./place.route');
const imageRoutes = require('./image.route');
const participantRoutes = require('./participant.route');
// const settingRoutes = require('./setting.route');

// router.use('/setting', settingRoutes);
router.use('/participants', participantRoutes);
router.use('/images', imageRoutes);
router.use('/places', placeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/comments', commentRoutes);
router.use('/friends', friendRoutes);
router.use('/posts', postRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);

module.exports = router;