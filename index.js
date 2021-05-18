const http = require('http')
const express = require('express')
const app = express()

app.get('/', async (req, res) => {
  res.send('Hello World')
})

const server = http.createServer(app)
server.listen(process.env.PORT, () => {
  console.log('Server started listening on port ', process.env.PORT)
})
