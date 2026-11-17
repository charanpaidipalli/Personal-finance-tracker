const User = require('../models/User');
const { hashToken, readSessionToken } = require('../auth/session');

module.exports = async function requireAuth(req, res, next) {
  const token = readSessionToken(req);
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });

  try {
    const user = await User.findOne({
      sessionTokenHash: hashToken(token),
      sessionExpiresAt: { $gt: new Date() }
    }).select('+sessionTokenHash +sessionExpiresAt');

    if (!user) return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
