const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const passport = require('passport');
const User = require('../models/user.model');
const crypto = require('crypto');
const { BACKEND_URL } = require('../config/url.config');

function configureGooglePassport() {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // callbackURL: `${BACKEND_URL}/auth/oauth2/callback/google`,
        callbackURL: 'https://api-rendezvous.techwiz.tech/auth/oauth2/callback/google' //  /auth/oauth2/callback/google
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;

            let user = await User.findOne({ email });

            // xử lý nếu trùng username.
            let baseUsername = email.split('@')[0];
            let username = baseUsername;
            let counter = 1;
            while (await User.findOne({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            if (!user) {
                user = await User.create({
                    username,
                    email,
                    password: crypto.randomBytes(20).toString('hex'),
                    avatar: profile.photos[0]?.value,
                    authType: 'google',
                    description: '',
                    providerId: profile.id,
                    location: {
                        type: 'Point',
                        coordinates: [0, 0],
                    }
                });
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
}

function configureFacebookPassport() {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: 'https://api-rendezvous.techwiz.tech/auth/oauth2/callback/facebook',
        // callbackURL: `${BACKEND_URL}/auth/oauth2/callback/facebook`,
        profileFields: ['id', 'emails', 'name', 'picture.type(large)']
    }, async (accessToken, refreshToken, profile, done) => {
        console.log({ profile });

        try {
            const email = profile.emails?.[0]?.value || `${profile.id}@facebook.com`;

            let user = await User.findOne({ email });

            if (!user) {
                let namePart = '';

                if (profile.displayName) {
                    namePart = profile.displayName;
                } else if (profile.name) {
                    const givenName = profile.name.givenName || '';
                    const familyName = profile.name.familyName || '';

                    if (givenName && familyName) {
                        namePart = `${givenName} ${familyName}`;
                    } else if (givenName) {
                        namePart = givenName;
                    } else if (familyName) {
                        namePart = familyName;
                    }
                }

                if (!namePart) {
                    namePart = profile.id;
                }

                let cleanedName = namePart.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/đ/g, "d").replace(/Đ/g, "D")
                    .toLowerCase()
                    .replace(/\s+/g, '')
                    .replace(/[^a-z0-9]/g, '');

                let baseUsername = cleanedName;

                let username = baseUsername;
                let counter = 1;
                while (await User.findOne({ username })) {
                    username = `${baseUsername}${counter}`;
                    counter++;
                }

                user = await User.create({
                    username,
                    email,
                    password: crypto.randomBytes(20).toString('hex'),
                    avatar: profile.photos?.[0]?.value,
                    authType: 'facebook',
                    description: '',
                    providerId: profile.id,
                    location: {
                        type: 'Point',
                        coordinates: [0, 0],
                    }
                });
            }

            return done(null, user);
        } catch (err) {
            console.error("Error in Facebook Passport strategy:", err);
            return done(err, null);
        }
    }));
}

module.exports = {
    configureGooglePassport,
    configureFacebookPassport
};
