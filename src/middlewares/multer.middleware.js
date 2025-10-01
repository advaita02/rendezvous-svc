const multer = require('multer'); //multipart/form-data
const multerS3 = require('multer-s3');
const s3 = require('../config/s3.config');
const { v4: uuidv4 } = require('uuid');

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: `${process.env.AWS_BUCKET_NAME}`,
    key: function (req, file, cb) {
      cb(null, `${Date.now()}-${uuidv4()}-${file.originalname}`);
    },
  }),
  // limits: { fileSize: 5 * 1024 * 1024 }, //5MB
});

module.exports = upload;