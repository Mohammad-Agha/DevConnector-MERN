const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const auth = require('../../middleware/auth')
const Post = require('../../models/Post')
const Profile = require('../../models/Profile')
const User = require('../../models/User')

/**
 * @route  POST api/posts
 * @desc   Create a post
 * @access Private
 */
router.post('/', 
  [
    auth,
    [
      check('text', 'Text is required').not().isEmpty()
    ]
  ],
async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  try {
    const user = await User.findById(req.user.id).select('-password')

    const newPost = new Post({
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    })

    const post = await newPost.save()

    res.json(post)

  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
  }
  
})

/**
 * @route  GET api/posts
 * @desc   Get all posts
 * @access Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 })
    res.json(posts)

  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

/**
 * @route  GET api/posts/:post_id
 * @desc   Get a post by id
 * @access Private
 */
router.get('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)
    if(!post) return res.status(404).json({ msg: 'Post not found' })
    res.json(post)

  } catch (error) {
    console.error(error.message)
    if(error.kind == 'ObjectId') return res.status(404).json({ msg: 'Post not found' })
    res.status(500).send('Server error')
  }
})

/**
 * @route  DELETE api/posts/:post_id
 * @desc   Delete a post
 * @access Private
 */
router.delete('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)

    if(!post) return res.status(404).json({ msg: 'Post not found' })

    // Check if the user deleting the post owns it
    if(post.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' })
    
    await post.remove()

    res.json({ msg: 'Post removed' })

  } catch (error) {
    console.error(error.message)
    if(error.kind == 'ObjectId') return res.status(404).json({ msg: 'Post not found' })
    res.status(500).send('Server error')
  }
})

/**
 * @route  PUT api/posts/like/:post_id
 * @desc   Like a post
 * @access Private
 */

router.put('/like/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)

    if(!post) return res.status(404).json({ msg: 'Post not found' })

    // Check if the post has already been liked
    if(post.likes.some(like => like.user.toString() === req.user.id)) return res.status(400).json({ msg: 'Post already liked' })
    
    post.likes.unshift({ user: req.user.id })
    await post.save()
    res.json(post.likes)

  } catch (error) {
    console.error(error.message)
    if(error.kind == 'ObjectId') return res.status(404).json({ msg: 'Post not found' })
    res.status(500).send('Server error')
  }
})

/**
 * @route  PUT api/posts/unlike/:post_id
 * @desc   Unlike a post
 * @access Private
 */

router.put('/unlike/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)

    if(!post) return res.status(404).json({ msg: 'Post not found' })

    // We can't unlike a post if it's not even liked
    if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) return res.status(400).json({ msg: 'Post not liked yet' })
    
    // Get remove index
    const removedIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id)

    if(removedIndex == -1) return res.json({ msg: 'No like found' }) 

    post.likes.splice(removedIndex, 1)

    await post.save()

    res.json(post.likes)

  } catch (error) {
    console.error(error.message)
    if(error.kind == 'ObjectId') return res.status(404).json({ msg: 'Post not found' })
    res.status(500).send('Server error')
  }
})


module.exports = router