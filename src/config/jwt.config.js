module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'secret_key_jwt',
  REFRESH_SECRET: process.env.REFRESH_SECRET || 'refresh_secret_key_jwt'
};