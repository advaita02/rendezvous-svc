// src/config/cors.config.js
const { FRONTEND_URL, BACKEND_URL, LOCALHOST_URL } = require('./url.config');

const allowedOrigins = [
    'https://api-rendezvous.techwiz.tech',
    'https://rendezvous-svc.onrender.com',
    FRONTEND_URL,
    LOCALHOST_URL,
    'https://rendezvous.techwiz.tech',
    'https://rendezvous-mu.vercel.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    optionsSuccessStatus: 200,
};

module.exports = { corsOptions, allowedOrigins };
