
const buildUserResponse = (user) => ({
    userId: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    isPremium: user.isPremium,
    description: user.description,
});

const buildShortDetailUserResponse = (user) => ({
    userId: user._id,
    username: user.username,
    avatar: user.avatar,
    isPremium: user.isPremium,
});

const buildPostResponse = (post) => ({
    postId: post._id,
    user: post.user && typeof post.user === 'object' ? {
        userId: post.user._id,
        username: post.user.username,
        avatar: post.user.avatar,
        isPremium: post.user.isPremium,
    } : post.user,
    content: post.content,
    imageUrls: post.imageUrls,
    privacy: post.privacy,
    location: {
        type: post.location.type,
        coordinates: post.location.coordinates,
    },
    selectedLocation: {
        locationName: post.selectedLocation?.locationName || null,
        address: post.selectedLocation?.address || null,
        type: post.selectedLocation?.type || null,
        category: post.selectedLocation?.category || null,
    },

    maxParticipants: post.maxParticipants,
    expiredAt: post.expiredAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
});

const buildActivePostResponse = (activePost) => ({
    postId: activePost.postId,
    user: activePost.user && typeof activePost.user === 'object' ? {
        userId: activePost.user._id,
        username: activePost.user.username,
        avatar: activePost.user.avatar,
        isPremium: activePost.user.isPremium,
    } : activePost.user,
    content: activePost.content,
    imageUrls: activePost.imageUrls,
    privacy: activePost.privacy,
    location: {
        type: activePost.location.type,
        coordinates: activePost.location.coordinates,
    },
    selectedLocation: {
        locationName: activePost.selectedLocation?.locationName || null,
        address: activePost.selectedLocation?.address || null,
        type: activePost.selectedLocation?.type || null,
        category: activePost.selectedLocation?.category || null,
    },

    maxParticipants: activePost.maxParticipants,
    expiredAt: activePost.expiredAt,
    createdAt: activePost.createdAt,
    updatedAt: activePost.updatedAt,
});

const buildCommentResponse = (comment) => ({
    commentId: comment._id,
    user: comment.user && typeof comment.user === 'object' ? {
        userId: comment.user._id,
        username: comment.user.username,
        avatar: comment.user.avatar,
        isPremium: comment.user.isPremium,
    } : comment.user,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
});

const buildFriendRequestResponse = (friendRequest) => ({
    requestId: friendRequest._id,
    fromUser: friendRequest.fromUser && typeof friendRequest.fromUser === 'object' ? {
        userId: friendRequest.fromUser._id,
        username: friendRequest.fromUser.username,
        avatar: friendRequest.fromUser.avatar,
        isPremium: friendRequest.fromUser.isPremium,
    } : friendRequest.fromUser,
    toUser: friendRequest.toUser && typeof friendRequest.toUser === 'object' ? {
        userId: friendRequest.toUser._id,
        username: friendRequest.toUser.username,
        avatar: friendRequest.toUser.avatar,
        isPremium: friendRequest.toUser.isPremium,
    } : friendRequest.toUser,
    status: friendRequest.status,
    createdAt: friendRequest.createdAt,
    updatedAt: friendRequest.updatedAt,
});



const buildNotificationResponse = (notification) => {
    let targetId = null;
    let interactionType = null;

    if (notification.type === 'comment') {
        targetId = notification.comment;
    } else if (notification.type === 'interaction') {
        targetId = notification.interaction?._id || notification.interaction;
        interactionType = notification.interaction?.type || null;
    } else if (notification.type === 'friendRequest') {
        targetId = notification.friendRequest;
    } else if (notification.type === 'participant') {
        targetId = notification.participant;
    }

    return {
        notificationId: notification._id,
        // actorUsername: notification.actor?.username || notification.actor,
        // actorAvatar: notification.actor?.avatar,
        // actorPremium: notification.actor?.isPremium,
        actorUser: {
            userId: notification.actor?._id,
            username: notification.actor?.username,
            avatar: notification.actor?.avatar,
            isPremium: notification.actor?.isPremium,
        },
        type: notification.type,
        message: notification.message,
        targetId: targetId?._id.toString() || null,
        relatedPostId: notification.relatedPost,
        interactionType: interactionType,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        expiredAt: notification.expiredAt || null,
    };
};

const buildImageResponse = (image) => ({
    id: image._id,
    url: image.url,
    key: image.key,
    description: image.description || '',
    uploadedBy: image.uploadedBy,
    createdAt: image.createdAt,
    deletedAt: image.deletedAt || null,
});

const buildParticipantResponse = (participant) => ({
    participantId: participant._id,
    postId: participant.post?._id || buildPostResponse(participant.post),
    status: participant.status,
    joinedAt: participant.joinedAt,
    deletedAt: participant.deletedAt,
    user: buildShortDetailUserResponse(participant.user),
});


module.exports = {
    buildUserResponse,
    buildShortDetailUserResponse,
    buildPostResponse,
    buildActivePostResponse,
    buildCommentResponse,
    buildNotificationResponse,
    buildImageResponse,
    buildFriendRequestResponse,
    buildParticipantResponse,
};
