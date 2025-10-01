const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  description: { type: String },
  avatar: { type: String },
  isPremium: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  authType: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
  providerId: { type: String, },
  location: {
    type: {
      type: String, enum: ["Point"], required: true, default: "Point",
    },
    coordinates: {
      type: [Number], required: true, default: [0, 0]
    }
  },
  //for reset password
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },
}, {
  timestamps: true,
});

userSchema.index({ location: '2dsphere' });

//Hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
