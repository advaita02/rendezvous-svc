const jwt = require('jsonwebtoken');
const { generateAccessToken, verifyRefreshToken, COOKIE_OPTIONS } = require('../utils/token');
const { buildUserResponse } = require('../utils/responseBuilder');
const userTokenService = require('../services/userToken.service');
const userService = require('../services/user.service');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const { FRONTEND_URL } = require('../config/url.config');

//[POST] /auth/login
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await userService.getUserByUsernameAndEmail(identifier);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await userService.checkPassword(user, password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = await userTokenService.generateTokens(user._id);

    if (!accessToken || !refreshToken) {
      return res.status(500).json({ message: 'Failed to generate authentication tokens' });
    }

    const tokenDoc = await userTokenService.saveUserToken(
      user._id,
      accessToken,
      refreshToken,
      req.headers['user-agent'],
      req.ip,
    );
    console.log(tokenDoc);
    if (!tokenDoc) return res.status(500).json({ message: 'Failed to save tokendocs' });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.json({
      accessToken,
      user: buildUserResponse(user)
    });

  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// [POST] /auth/refresh-token
const refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const tokenDoc = await userTokenService.findUserTokenByRefreshToken(refreshToken);

    if (!tokenDoc) {
      return res.status(401).json({ message: 'Refresh token is invalid' });
    }

    if (new Date() > tokenDoc.refreshTokenExpiresAt) {
      await userTokenService.softDeleteTokenByRefreshToken(refreshToken);
      return res.status(401).json({ message: 'Refresh token is expired' });
    }

    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(payload.id);

    const updated = await userTokenService.updateAccessTokenByRefreshToken(refreshToken, newAccessToken);

    if (!updated) {
      return res.status(404).json({ message: 'Refresh token not found in database' });
    }

    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

// [POST] /auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userService.getUserByEmail(email);
    // if (!user) return res.status(404).json({ message: 'Email does not exist' });

    // const authType = user.authType?.toString().toLowerCase();
    // if (authType === 'google' || authType === 'facebook') {
    //   return res.status(401).json({ message: 'Your account comes from Facebook or Google!' });
    // }

    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expires = Date.now() + 15 * 60 * 1000;

    user.resetPasswordCode = code;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    const templatePath = path.join(__dirname, '../resources/templates/reset-password.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    htmlTemplate = htmlTemplate.replace('${code}', code)
      .replace('${username}', user.username);
    const mailOptions = {
      to: email,
      subject: 'Rendezvous - Password Reset Code',
      html: htmlTemplate,
      attachments: [
        // {
        //   filename: 'techwiz.png',
        //   path: path.join(__dirname, '../resources/images/techwiz.png'),
        //   cid: 'logo_techwiz'
        // },
        {
          filename: 'logo-rendezvous.png',
          path: path.join(__dirname, '../resources/images/logo-rendezvous.png'),
          cid: 'logo_rendezvous'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Verification code has been sent to your email' });

  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

//[POST] /auth/verify-reset-code
const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await userService.getUserByEmail(email);

    if (!user) return res.status(404).json({ message: 'Email does not exist' });

    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    };

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired.' });
    };

    res.status(200).json({ message: 'Verification successful.' });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// [POST] /auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await userService.getUserByEmail(email);
    if (!user || user.resetPasswordCode !== code || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification failed.' });
    };

    if (user && user.resetPasswordCode == code && user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Code expired.' });
    };

    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// [] SSO
const providerCallback = async (req, res, next) => {
  try {
    const user = req.user;

    const { accessToken, refreshToken } = await userTokenService.generateTokens(user._id);

    if (!accessToken || !refreshToken) {
      throw new Error('Failed to generate authentication tokens');
    }

    const tokenDoc = await userTokenService.saveUserToken(
      user._id,
      accessToken,
      refreshToken,
      req.headers['user-agent'],
      req.ip,
    );

    if (!tokenDoc) throw new Error('Failed to save token document');

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    const redirectUrl = new URL('https://rendezvous.techwiz.tech/auth/callback');
    redirectUrl.searchParams.set('token', accessToken);

    res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};


module.exports = {
  loginUser,
  refreshToken,
  providerCallback,
  forgotPassword,
  verifyResetCode,
  resetPassword,
}