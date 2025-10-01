const cron = require('node-cron');

const postService = require('../services/post.service');
const activePostService = require('../services/activePost.service');

// Every minute
cron.schedule('* * * * *', async () => {
    try {
        console.log('Cron job file loaded.');
        const expiredActivePosts = await activePostService.getExpiredActivePosts();

        if (expiredActivePosts.length > 0) {
            console.log(`Found ${expiredActivePosts.length} expired posts. Marking as deleted...`);
        }

        for (const activePost of expiredActivePosts) {
            await activePostService.deleteActivePostByPostId(activePost.postId);
            console.log(`Soft deleted post: ${activePost.postId}`);
        }
    } catch (error) {
        console.error('Error in cron job:', error);
    }
});