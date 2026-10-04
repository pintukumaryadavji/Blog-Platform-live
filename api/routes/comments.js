const router = require('express').Router();
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Comment author ya post author delete kar sakta hai
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Comment nahi mila' });
    const post = await Post.findById(c.post).select('author');
    const allowed = String(c.author) === req.user.id || (post && String(post.author) === req.user.id);
    if (!allowed) return res.status(403).json({ error: 'Permission nahi hai' });
    await c.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Comment delete nahi hua' });
  }
});

module.exports = router;
