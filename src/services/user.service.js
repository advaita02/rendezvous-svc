const User = require('../models/user.model');
const { geographicFilter } = require('../utils/location.utils');
const { buildShortDetailUserResponse } = require('../utils/responseBuilder');

const createUser = async ({ username, password, email, description, avatar }) => {
  return await User.create({ username, password, email, description, avatar });
};

const getUserById = async (id) => {
  return await User.findById(id).select('-password');
};

const getUserByUsername = async (username) => {
  return await User.findOne({ username }).select('-password -updatedAt -deletedAt -authType -__v');
};

const getUserByEmail = async (email) => {
  return await User.findOne({ email }).select('-password');
};

const getUserByUsernameAndEmail = async (usernameOrEmail) => {
  const user = await User.findOne({
    $or: [
      { username: usernameOrEmail },
      { email: usernameOrEmail }
    ]
  });
  return user;
};

const checkPassword = async (user, password) => {
  return await user.matchPassword(password);
};

const applyUserUpdates = async (user, updates) => {
  ['username', 'description', 'avatar', 'password', 'email'].forEach(field => {
    if (updates.hasOwnProperty(field)) {
      user[field] = updates[field];
    }
  });

  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

const getCurrentLocationUserByUserId = async (userId) => {
  const user = await User.findById(userId).select('location');
  return user.location;
}

const getUsersNearMyLocation = async (myLocation, maxDistance, page = 1, limit = 10, viewerId = null) => {
  const skip = (page - 1) * limit;
  // const radiusInRadians = maxDistanceMeters / 6371; // Earth radius

  // const query = {
  //   location: {
  //     $geoWithin: {
  //       $centerSphere: [myLocation.coordinates, radiusInRadians]
  //     }
  //   }
  // };

  const query = geographicFilter(myLocation, maxDistance);

  if (viewerId) {
    query._id = { $ne: viewerId };
  }

  const [totalUser, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .skip(skip)
      .limit(limit)
      .select('-password')
  ]);

  const filteredUsers = users.map(buildShortDetailUserResponse);

  return {
    data: filteredUsers,
    pagination: {
      page,
      limit,
      totalUser,
      hasMore: page * limit < totalUser
    }
  };
};

const updateUserLocation = async (userId, location) => {
  await User.findByIdAndUpdate(userId, {
    location,
  });
};

const setPremiumById = async (id) => {
  await User.findByIdAndUpdate(id, {
    isPremium: true
  });
};

module.exports = {
  getUserByUsername,
  createUser,
  getUserById,
  applyUserUpdates,
  getUserByEmail,
  getUserByUsernameAndEmail,
  checkPassword,
  getCurrentLocationUserByUserId,
  updateUserLocation,
  getUsersNearMyLocation,
  setPremiumById,
};
