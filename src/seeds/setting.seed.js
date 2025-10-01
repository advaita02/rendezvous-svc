const mongoose = require('mongoose');
const Setting = require('../models/setting.model');
const connectMongoDB = require('../config/connectMongoDB.config');

const seedSettings = async () => {
    try {
        await connectMongoDB();

        const settings = [
            {
                key: 'post_expiry_time_premium',
                value: 3 * 60 * 60, //3 hours
                description: 'Post expiration time for premium users (in seconds)',
            },
            {
                key: 'post_expiry_time_normal',
                value: 1 * 60 * 60, //1 hours
                description: 'Post expiration time for regular users (in seconds)',
            },
            {
                key: 'max_search_radius_premium',
                value: 10,
                description: 'Maximum search radius for premium users (in kilometers)',
            },
            {
                key: 'max_search_radius_normal',
                value: 2,
                description: 'Maximum search radius for regular users (in kilometers)',
            },
        ];

        for (const setting of settings) {
            const exists = await Setting.findOne({ key: setting.key });
            if (!exists) {
                await Setting.create(setting);
                console.log(`Added setting: ${setting.key}`);
            } else {
                console.log(`Setting "${setting.key}" already exists, skipping.`);
            }
        }

        await mongoose.disconnect();
        console.log('Finished seeding settings.');
    } catch (error) {
        console.log(error);
    }
};

module.exports = { seedSettings };
