const express = require('express')
const connectDB = require('./config/db')
require('dotenv/config')

const app = express()

connectDB()

app.get('/', (req, res) => {
  res.send('Home route running')
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))