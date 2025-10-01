const imageService = require('../services/image.service');
const { buildImageResponse } = require('../utils/responseBuilder');

// [GET] /images
const getImagesByUserId = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        if (!user) {
            return res.status(401).json({ message: 'Login required!!!' });
        }
        const images = await imageService.getImagesByUserId(user._id, page, limit);
        res.json(images);
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

module.exports = {
    getImagesByUserId,
}