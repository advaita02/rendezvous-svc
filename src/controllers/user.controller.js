const userService = require('../services/user.service');
const participantService = require('../services/participant.service');
const friendRequestService = require('../services/friendRequest.service');
const postService = require('../services/post.service');
const interactionService = require('../services/interaction.service');
const settingService = require('../services/setting.service');
const { buildUserResponse } = require('../utils/responseBuilder');
const { parseLocation } = require('../utils/location.utils');

//[POST] /user/register
const registerUser = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const userExists = await userService.getUserByUsername(username);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const emailExists = await userService.getUserByEmail(email);
    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await userService.createUser({ username, password, email });
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// [PUT] /user/update-info
const updateInfo = async (req, res) => {
  try {
    const updates = { ...req.body };

    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (updates.password && updates.password.trim() !== '') {
      const isSamePassword = await userService.checkPassword(user, updates.password);
      if (isSamePassword) {
        return res.status(400).json({ message: 'New password must be different from current password' });
      }
    }

    if (req.file && req.file.location) {
      updates.avatar = req.file.location;
    }

    const updatedUser = await userService.applyUserUpdates(user, updates);
    res.json(buildUserResponse(updatedUser));
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

//[GET] /user/current-user
const getCurrentUser = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.status(200).json({
    user: buildUserResponse(req.user)
  });
};

//[GET] /user/:username (profile)
const getUserByUsername = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await userService.getUserByUsername(username);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const countPosts = await postService.countPostsOfUserId(user._id);
    // const countJoins = await interactionService.countJoinsByUserId(user._id);
    const countJoins = await participantService.countJoinParticipantPostsByUserId(user._id);
    const countFriends = await friendRequestService.countFriendsByUserId(user._id);

    res.status(200).json({
      user: buildUserResponse(user),
      countPosts: countPosts,
      countJoins: countJoins,
      countFriends: countFriends,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

//[PUT] /user/update-my-location/
const updateMyLocation = async (req, res) => {
  const userId = req.user?._id || null;
  if (!userId) {
    return res.status(401).json({ message: 'Login required!!!' });
  }

  let location;
  try {
    location = parseLocation(req);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  try {
    const location = await userService.updateUserLocation(userId, location);
    res.json({ message: 'Location updated successfully.', location });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

//[GET] /user/near-me
const getUsersNearme = async (req, res) => {
  const viewer = req.user || null;
  let viewerId;
  let location;
  try {
    location = parseLocation(req);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  try {
    //update location of user
    if (viewer) {
      await userService.updateUserLocation(viewer._id, location);
      viewerId = req.user._id;
    }

    const isPremium = viewer?.isPremium === true;
    const radiusKey = isPremium ? 'max_search_radius_premium' : 'max_search_radius_normal';
    const radius = await settingService.getSettingValue(radiusKey, 2);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await userService.getUsersNearMyLocation(location, radius, page, limit, viewerId);

    res.status(200).json(result);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

//[PATCH] /user/getPremium
const openPremium = async (req, res) => {
  try {
    // const { username } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: 'Login required.' })
    }

    await userService.setPremiumById(user._id);
    res.status(200).json({ message: 'Premium activated successfully' });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

module.exports = {
  registerUser,
  updateInfo,
  getCurrentUser,
  getUserByUsername,
  updateMyLocation,
  getUsersNearme,
  openPremium,
}

