import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import methodOverride from 'method-override'
import expressSession from 'express-session'
import morgan from 'morgan'

import passport from 'passport'
import { randomBytes } from 'crypto'
import { RedditStrategy } from 'passport-reddit'

import { URL } from 'url'

const REDDIT_CONSUMER_KEY = process.env.REDDIT_CONSUMER_KEY
const REDDIT_CONSUMER_SECRET = process.env.REDDIT_CONSUMER_SECRET

const __dirname = new URL('.', import.meta.url).pathname

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Reddit profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(obj, done) {
  done(null, obj)
})


// Use the RedditStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Reddit
//   profile), and invoke a callback with a user object.
//   callbackURL must match redirect uri from your app settings
passport.use(new RedditStrategy({
  clientID: REDDIT_CONSUMER_KEY,
  clientSecret: REDDIT_CONSUMER_SECRET,
  callbackURL: "http://localhost:3000/auth/reddit/callback"
},
  function(_accessToken, _refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function() {

      // To keep the example simple, the user's Reddit profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Reddit account with a user record in your database,
      // and return that user instead.
      return done(null, profile)
    })
  }
))

var app = express()

// configure Express
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')
app.use(morgan('combined'))
app.use(cookieParser())
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(methodOverride())
app.use(expressSession({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}))
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static(__dirname + '/public'))


app.get('/', function(req, res) {
  res.render('index', { user: req.user })
})

app.get('/account', ensureAuthenticated, function(req, res) {
  res.render('account', { user: req.user })
})

app.get('/login', function(req, res) {
  res.render('login', { user: req.user })
})

// GET /auth/reddit
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Reddit authentication will involve
//   redirecting the user to reddit.com.  After authorization, Reddit
//   will redirect the user back to this application at /auth/reddit/callback
app.get('/auth/reddit', function(req, res, next) {
  passport.authenticate('reddit', {
    duration: 'permanent'
  })(req, res, next)
})

// GET /auth/reddit/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/reddit/callback', function(req, res, next) {
  passport.authenticate('reddit', {
    successRedirect: '/',
    failureRedirect: '/login'
  })(req, res, next)
})

app.get('/logout', function(req, res) {
  req.logout()
  res.redirect('/')
})

app.listen(3000)

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
