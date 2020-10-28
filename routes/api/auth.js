const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const User = require('../../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { check, validationResult} = require('express-validator')
require('dotenv/config')

/**
 * @route  GET api/auth
 * @desc   Test route
 * @access Public
 */
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

/**
 * @route  POST api/auth
 * @desc   Authenticate user & get token
 * @access Public
 */
router.post('/',
// Middleware 
[
  check('email', 'Email should be valid').isEmail(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req)

  // If there are anything wrong with the validation
  if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { password } = req.body

  const email = req.body.email.toLowerCase()

  try {
    // Check if email is valid
    let user = await User.findOne({ email })
    if(!user) return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] })

    // Check if password is valid
    const passwordMatch = await bcrypt.compare(password, user.password)
    if(!passwordMatch) return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] }) 

    // Return token
    const payLoad = {
      user: {
        id: user.id
      }
    }
    jwt.sign(payLoad, process.env.jwtSecret, (err, token) => {
      if(err) throw err
      res.json({ token })
    })

  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')  
  }

})

module.exports = router