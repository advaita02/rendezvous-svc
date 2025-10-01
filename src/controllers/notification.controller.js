const notificationService = require('../services/notification.service');
const Notification = require('../models/notification.model');
const { buildNotificationResponse } = require('../utils/responseBuilder');
const SSEChannel = require('sse-channel');

//Later: use Redis
const userChannels = new Map();

//[GET] /notifications
const getAllNotifications = async (req, res) => {
    const userId = req.user?._id || null;
    if (!userId) {
        return res.status(401).json({ message: 'Login required!!!' });
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    try {
        const allNotifications = await notificationService.getAllNotificationsOfUserId(userId, page, limit);
        res.json(allNotifications);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// [PATCH] /notifications/read-all
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Login required.' });
        }

        await notificationService.markAllNotificationsAsReadByUserId(user._id);
        res.json({ message: 'All notifications marked as read.' })
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};

// [PATCH] /notifications/:id/read
const markNotificationAsRead = async (req, res) => {
    try {
        const { notiId } = req.params;

        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Login required.' });
        }

        const notification = await notificationService.markNotificationAsReadByNotiId(notiId);
        res.json(buildNotificationResponse(notification));
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
};

// [GET] /notifications/stream
const streamNotifications = (req, res) => {
    // const userId = req.user._id.toString();
    const userId = req.params.userId;
    if (!userChannels.has(userId)) {
        const channel = new SSEChannel({
            jsonEncode: true,
            pingInterval: 15000,
        });
        userChannels.set(userId, channel);
    };

    const channel = userChannels.get(userId);
    channel.addClient(req, res);

    channel.send({
        event: 'init',
        data: `SSE connected for user ${userId}`,
        timestamp: new Date().toISOString(),
    });

    req.on('close', () => {
        const activeChannel = userChannels.get(userId);
        if (activeChannel) {
            const clients = activeChannel.clients || [];
            if (clients.length === 0) {
                userChannels.delete(userId);
                console.log(`[SSE] User ${userId} disconnected. Removed from userChannels.`);
            }
        }
    });
};

const sendNotificationSSE = (userId, payload) => {
    const channel = userChannels.get(userId.toString());
    if (channel) {
        channel.send({
            event: 'notification',
            data: payload
        });
    }
};

module.exports = {
    getAllNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    streamNotifications,
    sendNotificationSSE,
};