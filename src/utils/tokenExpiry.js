
//set expire Time token into "Model UserToken"
const getAccessTokenExpiry = () => new Date(Date.now() + 15 * 60 * 1000); //15m
const getRefreshTokenExpiry = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); //30d

module.exports = {
    getAccessTokenExpiry,
    getRefreshTokenExpiry
};

