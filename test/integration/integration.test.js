/**
 * Brief disclaimer for what looks an overkill
 *
 * I've found myself returning to this code after three months of no node.js
 * coding.  As a resutl I had to dive the whole stack to get to _loadUserProfile
 * call, for example.
 *
 * These three tests are designed to ensure correct intention behind particular
 * features design.  I don't want to rely on my knowledge of a stack to check
 * optional oauth2 extensions working (duration parameter, in this case).
 *
 * In addition, auth unit test is horribly unclear in its intent, thus test for
 * that.
 *
 * If you find yourself updating this tiny library with new features, please
 * take your time and introduce new tests here, in case end result is
 * non-trivial to check for correctness.
 *
 * Be careful not to include such tests into unit tests. Unit tests are used to
 * calculate code coverage. Integration tests are hardly relevant for coverage
 * purposes, thus move to separate directory.
 */

/**
 * Defining integration app
 */

import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import methodOverride from 'method-override'
import expressSession from 'express-session'

import passport from 'passport'
import { randomBytes } from 'crypto'
import { RedditStrategy } from '../../lib/passport-reddit/index.js'

import { expect } from 'chai'

const REDDIT_CONSUMER_KEY = "--insert-reddit-consumer-key-here--"
const REDDIT_CONSUMER_SECRET = "--insert-reddit-consumer-secret-here--"

passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(obj, done) {
  done(null, obj)
})

const redditOptions = {
  clientID: REDDIT_CONSUMER_KEY,
  clientSecret: REDDIT_CONSUMER_SECRET,
  callbackURL: "http://127.0.0.1:3000/auth/reddit/callback"
}
const strategy = new RedditStrategy(redditOptions,
  function(_accessToken, _refreshToken, profile, done) {
    process.nextTick(function() {
      return done(null, profile)
    })
  }
)
passport.use(strategy)

const app = express()

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

const duration = 'somethingWonderful'
app.get('/auth/reddit_with_duration', function(req, res, next) {
  req.session.state = randomBytes(32).toString('hex')
  passport.authenticate('reddit', {
    state: req.session.state,
    duration: duration
  })(req, res, next)
})

app.get('/auth/reddit', function(req, res, next) {
  req.session.state = randomBytes(32).toString('hex')
  passport.authenticate('reddit', {
    state: req.session.state,
  })(req, res, next)
})

app.get('/auth/reddit/callback', function(req, res, next) {
  if (req.query.state == req.session.state) {
    passport.authenticate('reddit')(req, res, next)
  }
  else {
    next(new Error(403))
  }
}, function(_req, res, _next) {
  res.status(200).send('Welcome home!')
})

/**
 * Done defining integration app
 */

import { stub } from 'sinon'
import nock from 'nock'
import request from 'supertest'

describe('integration tests', function() {
  const redditAuth = nock('https://ssl.reddit.com')

  describe('token endpoint', function() {
    describe('authentication', function() {
      it('should authenticate using Basic HTTP Auth with "consumer key as the username and the consumer secret as the password"', function(done) {
        // respond with json containing access_token if auth is specified
        redditAuth
          // expect very particular header, with value built according to reddit spec
          .matchHeader('Authorization', "Basic " + Buffer("" + redditOptions.clientID + ":" + redditOptions.clientSecret).toString('base64'))
          .post('/api/v1/access_token')
          .reply(200, JSON.stringify({
            access_token: 'access test',
            refresh_token: null
          }))

        stub(strategy, "_loadUserProfile").callsFake(function(_accessToken, done) {
          const profile = {
            provider: 'reddit',
            id: '123',
            name: 'someone',
            link_karma: '100',
            comment_karma: '100',
          }
          done(null, profile)
        })

        // Imitate user, returning from authorization page
        request(app)
          .get('/auth/reddit/callback?code=redditCode')
          .expect(200, 'Welcome home!', function(err) {
            strategy._loadUserProfile.restore()
            if (err) {
              done(err)
            }
            else {
              redditAuth.done()
              done()
            }
          })
      })
    })
  })

  describe('authorization redirect parameters', function() {
    describe('duration', function() {
      it('should not be present by default', function(done) {
        request(app)
          .get('/auth/reddit')
          .expect(302)
          .end(function(err, res) {
            if (err) done(err)
            else {
              expect(res.headers.location.indexOf('duration')).to.equal(-1)
              done()
            }
          })
      })

      it('should be set from passport strategy options', function(done) {
        request(app)
          .get('/auth/reddit_with_duration')
          .expect('Location', new RegExp('duration=' + duration))
          .expect(302, done)
      })
    })
  })
})
