const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

function sign(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET set nahi hai');
  return jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'username, email, password zaroori hain' });
    if (password.length < 6) return res.status(400).json({ error: 'Password kam se kam 6 characters ka ho' });
    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (exists) return res.status(409).json({ error: 'Username ya email pehle se registered hai' });
    const user = await User.create({ username, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: sign(user), user: { id: user._id, username: user.username } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Register fail ho gaya' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email aur password zaroori hain' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Email ya password galat hai' });
    res.json({ token: sign(user), user: { id: user._id, username: user.username } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login fail ho gaya' });
  }
});

router.get('/me', auth, (req, res) => res.json({ user: req.user }));

module.exports = router;
