const { default: mongoose } = require('mongoose');
const Comment = require('../models/comment.model');
const notificationService = require('../services/notification.service');

const countCommentsByPostId = async (postId) => {
  const count = await Comment.countDocuments({
    post: new mongoose.Types.ObjectId(postId),
    deletedAt: null
  });
  return count;
};

const getCommentsByPostId = async (postId, page = 1, limit = 10) => {
  const filter = {
    post: new mongoose.Types.ObjectId(postId),
    deletedAt: null,
  };

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .populate('user', '_id username avatar isPremium')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Comment.countDocuments(filter),
  ]);

  return { comments, total };
};

const findCommentByCommentId = async (commentId) => {
  return Comment.findOne({
    _id: commentId,
    deletedAt: null,
  });
};

const softDeleteComment = async (comment) => {
  const now = new Date();
  comment.deletedAt = now;
  const deletedComment = await comment.save();
  return deletedComment;
};

const updateComment = async (comment, content) => {
  comment.content = content;
  const updatedComment = await comment.save();

  const populatedComment = await Comment.findById(updatedComment._id)
    .populate('user', '_id username avatar isPremium');

  return populatedComment;
};

const addCommentAtPostIdByUserId = async (postId, userId, comment) => {
  const message = 'hehe';
  const newComment = await Comment.create({
    user: userId,
    post: postId,
    content: comment,
    message: message,
  });

  const populatedComment = await Comment.findById(newComment._id)
    .populate('user', '_id username avatar isPremium')
    .populate({
      path: 'post',
      select: '_id user expiredAt',
      populate: { path: 'user', select: '_id' }
    });
  return populatedComment;
};

module.exports = {
  countCommentsByPostId,
  getCommentsByPostId,
  addCommentAtPostIdByUserId,
  softDeleteComment,
  findCommentByCommentId,
  updateComment,
}