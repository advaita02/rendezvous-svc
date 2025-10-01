const Image = require('../models/image.model');
const { buildImageResponse } = require('../utils/responseBuilder');

const saveImagesToDatabase = async ({ files, userId, description }) => {
    // if (!files || files.length === 0) throw new Error('No files to save');

    const fileArray = Array.isArray(files) ? files : [files];

    const savedImages = [];

    for (const file of fileArray) {
        const image = new Image({
            url: file.location,
            key: file.key,
            uploadedBy: userId,
            description: description || '',
        });
        await image.save();
        console.log('[DEBUG] Saved image:', image.toObject());
        savedImages.push(image);
    }
    console.log('image1' + savedImages);
    return savedImages;
};

const getImagesByUserId = async (userId, page = 1, limit = 12) => {
    const images = await Image.find({ uploadedBy: userId, deletedAt: null })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    const totalImages = await Image.countDocuments({ uploadedBy: userId, deletedAt: null });
    return {
        data: images.map(buildImageResponse),
        pagination: {
            page,
            limit,
            totalImages,
            hasMore: page * limit < totalImages
        }
    };
};

const getImagesByUrls = async (urls) => {
    return await Image.find({ url: { $in: urls }, deletedAt: null });
};

const softDeleteImageById = async (id) => {
    return await Image.findByIdAndUpdate(id, { deletedAt: new Date() });
};


module.exports = {
    saveImagesToDatabase,
    getImagesByUserId,
    getImagesByUrls,
    softDeleteImageById,
};