const UserToken = require('../models/userToken.model');
const { generateAccessToken, generateRefreshToken, decodeToken } = require('../utils/token');
const { getAccessTokenExpiry, getRefreshTokenExpiry } = require('../utils/tokenExpiry');
const jwt = require('jsonwebtoken');

const saveUserToken = async (userId, accessToken, refreshToken, userAgent, ipAddress ) => {
    const accessTokenExpiresAt = getAccessTokenExpiry();
    const refreshTokenExpiresAt = getRefreshTokenExpiry();

    const tokenDoc = await UserToken.create({
      user: userId,
      accessToken,
      refreshToken,
      userAgent,
      ipAddress,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    });

    return tokenDoc;
};

const generateTokens = async (userId) => {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    return { accessToken, refreshToken };
};

const updateAccessToken = async (refreshToken, accessToken, accessTokenExpiresAt) => {
  return await UserToken.findOneAndUpdate(
    { refreshToken },
    {
      accessToken,
      accessTokenExpiresAt,
    },
    { new: true }
  );
};

// Hàm này nhận vào refreshToken và accessToken mới, cập nhật lại accessToken trong DB
const updateAccessTokenByRefreshToken = async (refreshToken, newAccessToken) => {
  const decodedAccess = decodeToken(newAccessToken);
  const accessTokenExpiresAt = new Date(decodedAccess.exp * 1000);

  const updated = await updateAccessToken(refreshToken, newAccessToken, accessTokenExpiresAt);

  return updated;
};


const findUserTokenByRefreshToken = async (refreshToken) => {
  return await UserToken.findOne({ refreshToken, deletedAt: null });
};

const softDeleteTokenByRefreshToken = async (refreshToken) => {
  return await UserToken.findOneAndUpdate(
    { refreshToken },
    { deletedAt: new Date() },
    { new: true }
  );
};

module.exports = {
  saveUserToken,
  generateTokens,
  updateAccessToken,
  updateAccessTokenByRefreshToken,
  findUserTokenByRefreshToken,
  softDeleteTokenByRefreshToken,
}