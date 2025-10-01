const userTokenService = require('../services/userToken.service');

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        const tokenDoc = await userTokenService.softDeleteTokenByRefreshToken(refreshToken);
        if (!tokenDoc) {
            return res.status(404).json({ message: 'Token not found or already logged out' });
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        });

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
}

module.exports = {
    logout,
}