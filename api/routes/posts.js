const router = require('express').Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ error: 'Invalid id' });

// List
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'username').lean();
    res.json(posts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Posts load nahi hue' });
  }
});

// Single post + comments
router.get('/:id', validId, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username').lean();
    if (!post) return res.status(404).json({ error: 'Post nahi mila' });
    const comments = await Comment.find({ post: post._id }).sort({ createdAt: 1 }).populate('author', 'username').lean();
    res.json({ ...post, comments });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Post load nahi hua' });
  }
});

// Create
router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body || {};
    if (!title || !content) return res.status(400).json({ error: 'title aur content zaroori hain' });
    const post = await Post.create({ title, content, author: req.user.id });
    res.status(201).json(post);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Post create nahi hua' });
  }
});

// Edit (sirf author)
router.put('/:id', auth, validId, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post nahi mila' });
    if (String(post.author) !== req.user.id) return res.status(403).json({ error: 'Sirf author edit kar sakta hai' });
    const { title, content } = req.body || {};
    if (title) post.title = title;
    if (content) post.content = content;
    await post.save();
    res.json(post);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Post update nahi hua' });
  }
});

// Delete (sirf author) + uske comments
router.delete('/:id', auth, validId, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post nahi mila' });
    if (String(post.author) !== req.user.id) return res.status(403).json({ error: 'Sirf author delete kar sakta hai' });
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Post delete nahi hua' });
  }
});

// Comments
router.get('/:id/comments', validId, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id }).sort({ createdAt: 1 }).populate('author', 'username').lean();
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: 'Comments load nahi hue' });
  }
});

router.post('/:id/comments', auth, validId, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'Comment khali nahi ho sakta' });
    const post = await Post.findById(req.params.id).select('_id');
    if (!post) return res.status(404).json({ error: 'Post nahi mila' });
    const c = await Comment.create({ post: post._id, author: req.user.id, text });
    res.status(201).json(await c.populate('author', 'username'));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Comment add nahi hua' });
  }
});

module.exports = router;
