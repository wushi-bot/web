const http = require('http')
const express = require('express')
const path = require('path')
const request = require('@aero/centra')
const passport = require('passport')
const session = require('express-session')
const flash = require('connect-flash')
const url = require('url')
const bodyParser = require('body-parser')
require('dotenv').config()

const app = express()

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((obj, done) => done(null, obj))

const Strategy = require('passport-discord').Strategy
const MemoryStore = require('memorystore')(session)

passport.use(new Strategy({
  clientID: '755526238466080830',
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.DOMAIN + '/callback',
  scope: ['identify', 'guilds']
},
(accessToken, refreshToken, profile, done) => {
  process.nextTick(() => done(null, profile))
}))

app.use(session({
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: '#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n',
  resave: false,
  saveUninitialized: false
}))
app.use(flash())
app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success')
  res.locals.error_messages = req.flash('error')
  next()
})

app.use(passport.initialize())
app.use(passport.session())
app.locals.domain = process.env.DOMAIN + '/callback'.split('//')[1]
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next()
  req.session.backURL = req.url
  res.redirect('/login')
}

app.set('view engine', 'pug')
app.use(express.static(path.join(__dirname, '/public')))

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((obj, done) => done(null, obj))

app.get('/', async (req, res) => {
  let avatar
  let response
  if (req.isAuthenticated()) {
    let userAvy = req.user || null
    avatar = 'https://cdn.discordapp.com/avatars/' + userAvy.id + '/' + userAvy.avatar + '?size=128'
    response = await request(process.env.API_URL + '/eco/' + userAvy.id)
     .header('Authorization', process.env.AUTHORIZATION)
     .json()
  }
  return res.render('index', { user: req.isAuthenticated() ? req.user : null, avatar: req.isAuthenticated() ? avatar : null, economy: res })
})

app.get('/commands', async (req, res) => {
  let response
  if (req.isAuthenticated()) {
    let userAvy = req.user || null
    avatar = 'https://cdn.discordapp.com/avatars/' + userAvy.id + '/' + userAvy.avatar + '?size=128'
  }
  response = await request(process.env.API_URL + '/commands')
    .header('Authorization', process.env.AUTHORIZATION)
    .json()
  return res.render('commands', { user: req.isAuthenticated() ? req.user : null, avatar: req.isAuthenticated() ? avatar : null, list: response.commands })
})

app.get('/vote', async (req, res) => {
  if (req.isAuthenticated()) {
    let userAvy = req.user || null
    avatar = 'https://cdn.discordapp.com/avatars/' + userAvy.id + '/' + userAvy.avatar + '?size=128'
  }
  return res.render('vote', { user: req.isAuthenticated() ? req.user : null, avatar: req.isAuthenticated() ? avatar : null })
})

app.get('/community', async (req, res) => {
  return res.redirect('https://discord.gg/zjqeYbNU5F')
})

app.get('/support', async (req, res) => {
  return res.redirect('https://discord.gg/zjqeYbNU5F')
})

app.get('/invite', async (req, res) => {
  return res.redirect('https://discord.com/api/oauth2/authorize?client_id=755526238466080830&permissions=3691375831&scope=bot')
})

app.get('/login', async (req, res, next) => {
  // We determine the returning url.
  if (req.session.backURL) {
    req.session.backURL = req.session.backURL // eslint-disable-line no-self-assign
  } else if (req.headers.referer) {
    const parsed = new url.URL(req.headers.referer)
    if (parsed.hostname === app.locals.domain) {
      req.session.backURL = parsed.path
    }
  } else {
    req.session.backURL = '/'
  }
  // Forward the request to the passport middleware.
  next()
},
passport.authenticate('discord'))

app.get('/logout', function (req, res) {
  req.session.destroy(() => {
    req.logout()
    res.redirect('/')
  })
})

app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
  // If user had set a returning url, we redirect them there, otherwise we redirect them to index.
  if (req.session.backURL) {
    const url = req.session.backURL
    req.session.backURL = null
    res.redirect(url)
  } else {
    res.redirect('/')
  }
})

const server = http.createServer(app)
server.listen(process.env.PORT, () => {
  console.log('Server started listening on port', process.env.PORT)
})
