const jwt = require('jsonwebtoken');
const { JWT_SECRET, REFRESH_SECRET } = require('../config/jwt.config');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '45m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '30d' });
};

const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);
const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET);

const decodeToken = (token) => jwt.decode(token);

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // cookie is only sent over https (not http)
  sameSite: 'none',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30d, if no set maxAge, default is Session
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
  decodeToken,
  COOKIE_OPTIONS,
};
