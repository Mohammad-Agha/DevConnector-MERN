const jwt = require('jsonwebtoken')
require('dotenv/config')


module.exports = (req, res, next) => {
  // Get the token from the header
  const token = req.header('x-auth-token')

  // Check if there is no token
  if(!token) return res.status(401).json({ msg: 'No token, access denied' })

  // Verify token
  try {
    const decodedToken = jwt.verify(token, process.env.jwtSecret)
    req.user = decodedToken.user
    next()
  } catch (error) {
    res.status(401).json({ msg: 'Invalid token' })
  }
} 