const postService = require('../services/post.service');
const activePostService = require('../services/activePost.service');
const participantService = require('../services/participant.service');
const commentService = require('../services/comment.service');
const settingService = require('../services/setting.service');
const Notification = require('../models/notification.model');
const imageService = require('../services/image.service');
const userService = require('../services/user.service');
const { buildPostResponse, buildCommentResponse } = require('../utils/responseBuilder');
const { parseLocation } = require('../utils/location.utils');
const { deleteImageFromS3 } = require('../utils/s3.utils');

// [DELETE] /posts/:postId/delete
const deletePost = async (req, res) => {
  const userId = req.user._id;
  if (!userId) {
    return res.status(401).json({ message: 'Login required!!!' });
  }
  const postId = req.params.postId;
  console.log('userId' + userId);
  if (!postId) {
    return res.status(400).json({ message: 'postId is required!' });
  }

  try {
    const post = await postService.getPostById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user._id.toString() !== userId.toString()) {
      console.log('other user id' + post.user._id.toString())
      return res.status(403).json({ message: 'You cannot delete a post of another user!' });
    };

    if (post.deletedAt) {
      return res.status(400).json({ message: 'Post already deleted' });
    };

    await postService.softDeleteExpiredPost(post);
    await activePostService.deleteActivePostByPostId(post._id);

    await Notification.deleteMany({ relatedPost: post._id });
    await participantService.softDeleteParticipantsByPostId(post._id);
    return res.status(200).json({ message: 'Post soft-deleted successfully' });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// [POST] /posts 
const createPost = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Login required!!!' });
    }
    const { content, privacy = 'public', locationName, address, type, category, maxParticipants = null } = req.body;

    let location;
    try {
      location = parseLocation(req);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    // const imageUrls = req.files ? req.files.map(file => file.location) : [];

    // if (req.files && req.files.length > 5) {
    //   return res.status(400).json({ message: 'You can upload up to 5 images only.' });
    // }

    let savedImages = [];
    if (req.files && req.files.length > 0) {
      console.log('[DEBUG] Gọi saveImagesToDatabase');
      savedImages = await imageService.saveImagesToDatabase({
        files: req.files,
        userId: user._id,
      });
      console.log('[DEBUG] Result savedImages:', savedImages);
    }
    const imageUrls = savedImages.map(img => img.url);

    const expiryKey = user.isPremium ? 'post_expiry_time_premium' : 'post_expiry_time_normal';
    const expiryTime = await settingService.getSettingValue(expiryKey, 3600);
    const expiredAt = new Date(Date.now() + expiryTime * 1000);

    const savedPost = await postService.createPost(user._id, {
      content,
      imageUrls,
      privacy,
      location,
      expiredAt,
      locationName, address, type, category, maxParticipants
    });

    const savedActivePost = await activePostService.addActivePost({
      postId: savedPost._id,
      userId: user._id,
      content,
      imageUrls,
      privacy,
      location,
      expiredAt,
      selectedLocation: {
        locationName,
        address,
        type,
        category
      },
      maxParticipants,
      activityType: null,
    });

    res.status(201).json(buildPostResponse(savedPost));
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

//[GET] /posts
const getAllPosts = async (req, res) => {
  try {
    const viewer = req?.user || null;
    const viewerId = viewer?._id;

    let location;
    try {
      location = parseLocation(req);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    if (viewerId) {
      await userService.updateUserLocation(viewerId, location);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category || null;

    const posts = await postService.getVisibleActivePostsForViewer(viewer, location, page, limit, category);

    return res.status(200).json(posts);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// [GET] /posts/:id
const getPostById = async (req, res) => {
  try {
    const postId = req.params.postId;
    if (!postId) return res.status(400).json({ message: 'postId is required' });

    const post = await postService.getPostById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.json(buildPostResponse(post));
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// [GET] /user/:username/posts
const getPostsByUsername = async (req, res) => {
  const { username } = req.params;
  const viewer = req?.user || null;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const result = await postService.getVisiblePostsOfUser(username, viewer, page, limit);
    return res.status(200).json(result);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

//[GET] /user/:username/joined-posts
const getJoinedPostsByUsername = async (req, res) => {
  const { username } = req.params;
  const viewerId = req.user?._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const user = await userService.getUserByUsername(username);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    const result = await postService.getPostsJoinedByUser(user._id, viewerId, page, limit);
    return res.json(result);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

//[PUT] /posts/:postId/update
const updatePost = async (req, res) => {
  try {
    if (!req.user._id) return res.status(401).json({ message: 'Not Authenticated!' });

    const userId = req.user._id;
    const { postId } = req.params;
    if (!postId) return res.status(401).json({ message: 'postId is required!' });
    const { content, privacy, locationName, address, type, category, maxParticipants } = req.body;

    // // handle image
    // let oldImages = [];
    // try {
    //   if (req.body.oldImages) {
    //     const raw = req.body.oldImages;

    //     if (raw.trim().startsWith('[')) {
    //       oldImages = JSON.parse(raw);
    //     } else {
    //       throw new Error('Unsupported oldImages format');
    //     }
    //   }
    // } catch (err) {
    //   return res.status(400).json({ message: 'Invalid format for oldImages.' });
    // }

    // let imageUrls = [...oldImages];
    // if (req.files && req.files.length > 0) {
    //   const newImages = req.files.map(file => file.location);
    //   imageUrls = imageUrls.concat(newImages);
    // };

    // if (imageUrls.length > 5) {
    //   return res.status(401).json({ message: 'Upload image limit to 5.' })
    // };

    // Handle image section.
    let oldImageUrls = [];
    try {
      const raw = req.body.oldImages;
      if (raw && raw.trim().startsWith('[')) {
        oldImageUrls = JSON.parse(raw);
      }
    } catch (err) {
      return res.status(400).json({ message: 'Invalid format for oldImages.' });
    }

    const post = await postService.getPostByPostIdAndUserId(postId, userId);
    if (!post) return res.status(404).json({ message: 'Post not found or Post is expired!' });

    const approvedCount = await participantService.countApprovedParticipantByPostId(post._id);

    if (maxParticipants < approvedCount) {
      return res.status(400).json({
        message: `Cannot set maxParticipants to ${maxParticipants} because ${approvedCount} participants are already approved.`,
      });
    }

    const existingImages = await imageService.getImagesByUrls(post.imageUrls || []);
    console.log('post_imageUrls: ' + post.imageUrls);
    console.log('existing_imageUrl: ' + existingImages);

    const deletedImages = existingImages.filter(img => !oldImageUrls.includes(img.url));

    await Promise.all(
      deletedImages.map(async (img) => {
        await imageService.softDeleteImageById(img._id);
        await deleteImageFromS3(img.key);
      })
    );

    let newImageRecords = [];
    if (req.files?.length) {
      newImageRecords = await imageService.saveImagesToDatabase({
        files: req.files,
        userId,
      });
    }

    const finalImageUrls = [
      ...oldImageUrls,
      ...newImageRecords.map(img => img.url)
    ];

    if (finalImageUrls.length > 5) {
      return res.status(400).json({ message: 'Upload image limit is 5.' });
    }

    //handle location
    let location = undefined;
    try {
      location = parseLocation(req);
    } catch (err) {
      console.log('Location not updated:', err.message);
    };

    // const post = await postService.getPostByPostIdAndUserId(postId, userId);
    // if (!post) return res.status(404).json({ message: 'Post not found or Post is expired!' });

    const updatedPost = await postService.applyPostUpdates(post, {
      content,
      privacy,
      imageUrls: finalImageUrls,
      location,
      locationName, address, type, category,
      maxParticipants,
    });

    await activePostService.updateActivePostByPostId(post._id, {
      content,
      privacy,
      imageUrls: finalImageUrls,
      location,
      selectedLocation: {
        locationName,
        address,
        type,
        category
      },
      maxParticipants,
    });


    res.json(buildPostResponse(updatedPost));
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

module.exports = {
  createPost,
  getPostById,
  getPostsByUsername,
  getJoinedPostsByUsername,
  getAllPosts,
  updatePost,
  deletePost,
};