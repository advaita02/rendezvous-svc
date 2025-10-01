const mongoose = require('mongoose');
const { HOST, PORT_DB, DB } = require('./db.config');

const MONGO_URI = 'mongodb+srv://lbnam1609_db_user:Il6hamv1vfx2IzFE@cluster0.abxywl9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectMongoDB;
