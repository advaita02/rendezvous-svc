const { Server } = require('socket.io');
const { BACKEND_URL, FRONTEND_URL, LOCALHOST_URL } = require('../config/url.config');

const connectedUsers = new Map(); // userId => Set<socketId>
let io = null;
const { corsOptions } = require('../config/cors.config');

function initSocket(server) {
    console.log('[Socket] Initializing Socket.IO...');
    io = new Server(server, {
        cors: corsOptions
    });
    io.on('connection', (socket) => {
        console.log(`[Socket] New connection: ${socket.id}`);

        socket.on('register', (userId) => {
            if (!userId) return;
            const currentSockets = connectedUsers.get(userId) || new Set();
            currentSockets.add(socket.id);
            connectedUsers.set(userId, currentSockets);
            console.log(`[Socket] User ${userId} registered socket ${socket.id}`);
        });

        socket.on('disconnect', () => {
            for (const [userId, socketSet] of connectedUsers.entries()) {
                if (socketSet.has(socket.id)) {
                    socketSet.delete(socket.id);
                    console.log(`[Socket] Socket ${socket.id} removed from user ${userId}`);
                    if (socketSet.size === 0) {
                        connectedUsers.delete(userId);
                        console.log(`[Socket] User ${userId} completely disconnected`);
                    } else {
                        connectedUsers.set(userId, socketSet);
                    }
                    break;
                }
            }
        });

        socket.on('unregister', (userId) => {
            if (connectedUsers.has(userId)) {
                const socketSet = connectedUsers.get(userId);
                socketSet.delete(socket.id);
                if (socketSet.size === 0) {
                    connectedUsers.delete(userId);
                } else {
                    connectedUsers.set(userId, socketSet);
                }
                console.log(`[Socket] User ${userId} manually unregistered socket ${socket.id}`);
            }
        });
    });
}

function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
}

function getConnectedUsers() {
    return connectedUsers;
}

module.exports = {
    initSocket,
    getIO,
    getConnectedUsers,
};
