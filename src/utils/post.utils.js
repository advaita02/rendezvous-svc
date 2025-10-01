const interactionService = require('../services/interaction.service');
const commentService = require('../services/comment.service');
const friendRequestService = require('../services/friendRequest.service');
const { buildPostResponse, buildActivePostResponse } = require('../utils/responseBuilder');
const areFriends = require('../services/friendRequest.service').areFriends;

const enrichPost = async (post) => {
  const [interactions, comments] = await Promise.all([
    interactionService.countInteractionsByPostId(post._id),
    commentService.countCommentsByPostId(post._id)
  ]);

  const formatted = buildPostResponse(post);
  return {
    ...formatted,
    interactions,
    comments,
  };
};

const enrichActivePost = async (activePost) => {
  const [interactions, comments] = await Promise.all([
    interactionService.countInteractionsByPostId(activePost.postId),
    commentService.countCommentsByPostId(activePost.postId)
  ]);

  const formatted = buildActivePostResponse(activePost);
  return {
    ...formatted,
    interactions,
    comments,
  };
};

//This function for get joined-posts of username, because it filter a post populated by Interaction.
const canViewerSeePost = async (viewerId, post) => {
  if (post.privacy === 'public') return true;
  if (!viewerId) return false;
  if (String(post.user._id) === String(viewerId)) return true;

  const isFriend = await areFriends(viewerId, post.user._id);
  return isFriend && post.privacy === 'friend';
};

const buildPostFilter = async (viewer, baseFilter = {}) => {
  const viewerId = viewer?._id || null;
  const now = new Date();

  // No login: show only public posts
  if (!viewerId) {
    return {
      ...baseFilter,
      privacy: 'public',
      deletedAt: null,
      expiredAt: { $gt: now },
    };
  }

  const friendIds = await friendRequestService.getFriendIdsByUserId(viewerId);

  //this filter for getAllPostsOfUsername (when owner see posts)
  const isOwner = baseFilter.user?.toString?.() === viewerId.toString();
  if (isOwner) {
    return {
      ...baseFilter,
      deletedAt: null,
    };
  };

  return {
    ...baseFilter,
    deletedAt: null,
    expiredAt: { $gt: now },
    $or: [
      { privacy: 'public' },
      { privacy: 'friend', user: { $in: friendIds } },
      { user: viewerId }
    ]
  };
};

const buildActivePostFilter = async (viewer, baseFilter = {}, category = null) => {
  const categoryFilter = category
    ? { "selectedLocation.category": { $regex: `^${category}` } }
    : {};

  const viewerId = viewer?._id || null;
  if (!viewerId) {
    // No login: show only public posts 
    return {
      ...baseFilter,
      ...categoryFilter,
      privacy: 'public',
    };
  }
  const friendIds = await friendRequestService.getFriendIdsByUserId(viewerId);

  return {
    $or: [
      {
        user: viewerId,
        ...categoryFilter,
      },
      {
        ...baseFilter, //geoFilter
        ...categoryFilter,
        privacy: 'public',
      },
      {
        ...baseFilter, //geoFilter
        ...categoryFilter,
        privacy: 'friend',
        user: { $in: friendIds }
      }
    ]
  };
};


module.exports = {
  enrichPost,
  enrichActivePost,
  canViewerSeePost,
  buildPostFilter,
  buildActivePostFilter,
}