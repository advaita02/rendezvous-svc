const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { verifyAccessToken } = require('../utils/token');
const { getUserById } = require('../services/user.service')

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  try {
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await getUserById(decoded.id)
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = protect;
