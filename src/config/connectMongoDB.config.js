const mongoose = require('mongoose');
const { HOST, PORT_DB, DB } = require('./db.config');

const MONGO_URI = `mongodb://${HOST}:${PORT_DB}/${DB}`;

const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectMongoDB;
