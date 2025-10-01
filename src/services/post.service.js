const Post = require('../models/post.model');
const ActivePost = require('../models/activePost.model');
const Participant = require('../models/participant.model');
const userService = require('../services/user.service');
const activePostService = require('../services/activePost.service');
const { buildPostResponse } = require('../utils/responseBuilder');
const interactionService = require('../services/interaction.service');
const settingService = require('../services/setting.service');
const { enrichPost, enrichActivePost, buildPostFilter, canViewerSeePost, buildActivePostFilter } = require('../utils/post.utils');
const { geographicFilter } = require('../utils/location.utils');

const createPost = async (userId,
  { content, imageUrls, privacy, location, expiredAt, locationName, address, type, category, maxParticipants }) => {
  const newPost = new Post({
    content,
    imageUrls,
    privacy,
    expiredAt,
    user: userId,
    location,
    selectedLocation: {
      locationName,
      address,
      type,
      category
    },
    maxParticipants
  });

  const savedPost = await newPost.save();
  const populatedPost = await Post.findById(savedPost._id).populate('user');
  return populatedPost;
};

const getAllPostsSortedByCreatedAt = async () => {
  const posts = await Post.find({ privacy: 'public' })
    .populate('user', '_id username avatar')
    .sort({ createdAt: -1 });
  return posts;
};

const getPostById = async (postId) => {
  const post = await Post.findOne({
    _id: postId,
    deletedAt: null,
  }).populate('user', '_id username avatar');

  return post;
};

const getPostsWithUserInfoByFilter = async (filter, page = 1, limit = 20) => {
  return await Post.find(filter)
    .sort({ createdAt: -1 })
    .populate('user', '_id username avatar isPremium')
    .skip((page - 1) * limit)
    .limit(limit);
};

const getPostByPostIdAndUserId = async (postId, userId) => {
  const post = await Post.findOne({
    user: userId,
    _id: postId,
    deletedAt: null,
    // expiredAt: { $gt: new Date() },
  });
  return post;
};

const countPostsOfUserId = async (userId) => {
  const count = await Post.countDocuments({
    user: userId,
    deletedAt: null,
  })
  return count;
};

const getVisiblePostsForViewer = async (viewer, location, page = 1, limit = 20) => {
  const viewerId = viewer?._id || null;
  const isPremium = viewer?.isPremium || false;

  const radiusKey = isPremium ? 'max_search_radius_premium' : 'max_search_radius_normal';
  const radius = await settingService.getSettingValue(radiusKey, 2);

  // if (viewerId) {
  //   await userService.updateUserLocation(viewerId, location);
  // }

  const geoFilter = geographicFilter(location, radius);

  const filter = await buildPostFilter(viewer, {
    deletedAt: null,
    expiredAt: { $gt: new Date() },
    ...geoFilter
  });

  const totalPost = await Post.countDocuments(filter);
  const rawPosts = await getPostsWithUserInfoByFilter(filter, page, limit);
  const enriched = await Promise.all(rawPosts.map(enrichPost));

  return {
    data: enriched,
    pagination: {
      page,
      limit,
      totalPost,
      hasMore: page * limit < totalPost
    }
  };
};

const getVisibleActivePostsForViewer = async (viewer, location, page = 1, limit = 20, category = null) => {
  const viewerId = viewer?._id || null;
  const isPremium = viewer?.isPremium || false;

  const radiusKey = isPremium ? 'max_search_radius_premium' : 'max_search_radius_normal';
  const radius = await settingService.getSettingValue(radiusKey, 2); // default 2km
  console.log(`radius: ${radius}`);

  const geoFilter = geographicFilter(location, radius);
  const baseFilter = {
    ...geoFilter,
  };

  const filter = await buildActivePostFilter(viewer, baseFilter, category);

  // const totalPost = await ActivePost.countDocuments(filter);
  // const rawPosts = await activePostService.getActivePostsWithUserInfoByFilter(filter, page, limit);

  const [totalPost, rawPosts] = await Promise.all([
    ActivePost.countDocuments(filter),
    activePostService.getActivePostsWithUserInfoByFilter(filter, page, limit),
  ]);

  const enriched = await Promise.all(rawPosts.map(enrichActivePost));

  return {
    data: enriched,
    pagination: {
      page,
      limit,
      totalPost,
      hasMore: page * limit < totalPost,
    },
  };
};

const getVisiblePostsOfUser = async (username, viewer, page, limit) => {
  const user = await userService.getUserByUsername(username);
  if (!user) return null;

  const baseFilter = { user: user._id };
  const filter = await buildPostFilter(viewer, baseFilter);

  const rawPosts = await getPostsWithUserInfoByFilter(filter, page, limit);
  const total = await Post.countDocuments(filter);

  const enriched = await Promise.all(rawPosts.map(enrichPost));

  return {
    data: enriched,
    pagination: {
      page,
      limit,
      total,
      hasMore: page * limit < total
    }
  };
};

// const getVisibleJoinedPostsOfUser = async (username, viewerId, page, limit) => {
//   const user = await userService.getUserByUsername(username);
//   if (!user) return null;

//   const allInteractions = await interactionService.getJoinedInteractionsAndPopulatePostByUserId(user._id);
//   const validInteractions = allInteractions.filter(i => i.post);

//   const visible = [];

//   for (const inter of validInteractions) {
//     const canSee = await canViewerSeePost(viewerId, inter.post);
//     if (canSee) visible.push(inter.post);
//   }

//   const total = visible.length;
//   const paginated = visible.slice((page - 1) * limit, page * limit);
//   const enriched = await Promise.all(paginated.map(enrichPost));

//   return {
//     data: enriched,
//     pagination: {
//       page,
//       limit,
//       total,
//       hasMore: page * limit < total
//     }
//   };
// };

const getPostsJoinedByUser = async (targetUserId, viewerId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const participants = await Participant.find({
    user: targetUserId,
    status: 'approved',
    deletedAt: null
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'post',
      match: { deletedAt: null },
      populate: { path: 'user', select: '_id username avatar isPremium' }
    });

  const posts = participants
    .map(p => p.post)
    .filter(p => p);

  const visiblePosts = [];
  for (const post of posts) {
    const canSee = await canViewerSeePost(viewerId, post);
    if (canSee) visiblePosts.push(post);
  }

  const enriched = await Promise.all(visiblePosts.map(enrichPost));

  const totalApprovedPosts = await Participant.countDocuments({
    user: targetUserId,
    status: 'approved',
    deletedAt: null
  });

  return {
    data: enriched,
    pagination: {
      page,
      limit,
      totalPost: totalApprovedPosts,
      hasMore: page * limit < totalApprovedPosts
    }
  };
};

const applyPostUpdates = async (post, updates) => {
  ['privacy', 'content', 'imageUrls', 'location', 'maxParticipants'].forEach(field => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      post[field] = updates[field];
    }
  });

  if (!post.selectedLocation) post.selectedLocation = {};

  ['locationName', 'address', 'type', 'category'].forEach(field => {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      post.selectedLocation[field] = updates[field];
    }
  });

  await post.save();
  return post.toObject();
};

const getExpiredPosts = async () => {
  const now = new Date();
  return await Post.find({
    expiredAt: { $lte: now },
    deletedAt: null
  })
};

const softDeleteExpiredPost = async (post) => {
  const now = new Date();
  post.deletedAt = now;
  await post.save();
};

module.exports = {
  createPost,
  getAllPostsSortedByCreatedAt,
  getVisiblePostsForViewer,
  getVisiblePostsOfUser,
  getVisibleActivePostsForViewer,
  getPostById,
  getPostsWithUserInfoByFilter,
  countPostsOfUserId,
  applyPostUpdates,
  getPostByPostIdAndUserId,
  getExpiredPosts,
  softDeleteExpiredPost,
  getPostsJoinedByUser,
}

