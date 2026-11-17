const router = require('express').Router();
const { randomBytes } = require('crypto');
const User = require('../models/User');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const {
  COOKIE_NAME,
  SESSION_DURATION,
  createSessionToken,
  hashPassword,
  hashToken,
  readSessionToken,
  sessionCookieOptions,
  verifyPassword
} = require('../auth/session');

const legacyModels = [Income, Expense, Budget, Goal];

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

async function startSession(user, res) {
  const token = createSessionToken();
  user.sessionTokenHash = hashToken(token);
  user.sessionExpiresAt = new Date(Date.now() + SESSION_DURATION);
  await user.save();
  res.cookie(COOKIE_NAME, token, sessionCookieOptions());
}

router.post('/register', async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' });
    }
    if (await User.exists({ email })) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const isFirstUser = !(await User.exists({}));
    const passwordSalt = randomBytes(16).toString('hex');
    const user = await User.create({
      name,
      email,
      passwordSalt,
      passwordHash: await hashPassword(password, passwordSalt)
    });

    if (isFirstUser) {
      await Promise.all(legacyModels.map(model => model.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: user._id } }
      )));
    }

    await startSession(user, res);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password || password.length > 128) {
      return res.status(400).json({ message: 'Enter your email and password.' });
    }

    const user = await User.findOne({ email }).select('+passwordHash +passwordSalt');
    if (!user || !(await verifyPassword(password, user.passwordSalt, user.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    await startSession(user, res);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = readSessionToken(req);
    if (token) {
      await User.updateOne(
        { sessionTokenHash: hashToken(token) },
        { $unset: { sessionTokenHash: 1, sessionExpiresAt: 1 } }
      );
    }
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api'
    });
    res.json({ message: 'Signed out.' });
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const token = readSessionToken(req);
    if (!token) return res.json({ user: null });
    const user = await User.findOne({
      sessionTokenHash: hashToken(token),
      sessionExpiresAt: { $gt: new Date() }
    });
    res.json({ user: user ? publicUser(user) : null });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
