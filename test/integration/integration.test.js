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

var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , crypto = require('crypto')
  , RedditStrategy = require('passport-reddit').Strategy;

var REDDIT_CONSUMER_KEY = "--insert-reddit-consumer-key-here--";
var REDDIT_CONSUMER_SECRET = "--insert-reddit-consumer-secret-here--";

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

var redditOptions = {
    clientID: REDDIT_CONSUMER_KEY,
    clientSecret: REDDIT_CONSUMER_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/reddit/callback"
}
var strategy = new RedditStrategy(redditOptions,
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
);
passport.use(strategy);

var app = express();

app.configure(function() {
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

var duration = 'somethingWonderful';
app.get('/auth/reddit_with_duration', function(req, res, next){
  req.session.state = crypto.randomBytes(32).toString('hex');
  passport.authenticate('reddit', {
    state: req.session.state,
    duration: duration
  })(req, res, next);
});

app.get('/auth/reddit', function(req, res, next){
  req.session.state = crypto.randomBytes(32).toString('hex');
  passport.authenticate('reddit', {
    state: req.session.state,
  })(req, res, next);
});

app.get('/auth/reddit/callback', function(req, res, next){
  if (req.query.state == req.session.state){
    passport.authenticate('reddit')(req, res, next);
  }
  else {
    next( new Error(403) );
  }
}, function(req, res, next){
    res.send(200, 'Welcome home!');
});

/**
 * Done defining integration app
 */



var should = require('should');
var sinon = require('sinon');
var reddit = require('passport-reddit');
var nock = require('nock');
var request = require('supertest');

describe('integration tests', function(){
  var redditAuth = nock('https://ssl.reddit.com'),
  redditApi = nock('https://oauth.reddit.com');

  describe('token endpoint', function(){
    describe('authentication', function(){
      it('should authenticate using Basic HTTP Auth with "consumer key as the username and the consumer secret as the password"', function(done){
        // respond with json containing access_token if auth is specified
        redditAuth
          // expect very particular header, with value built according to reddit spec
          .matchHeader( 'Authorization', "Basic " + Buffer("" + redditOptions.clientID + ":" + redditOptions.clientSecret).toString('base64') )
          .post( '/api/v1/access_token' )
          .reply( 200, JSON.stringify({
            access_token: 'access test',
            refresh_token: null
          }));

        sinon.stub(strategy, "_loadUserProfile", function(accessToken, done){
          var profile = {
            provider: 'reddit',
            id: '123',
            name: 'someone',
            link_karma: '100',
            comment_karma: '100',
          };
          done(null, profile);
        });

        // Imitate user, returning from authorization page
        request(app)
          .get('/auth/reddit/callback?code=redditCode')
          .expect(200, 'Welcome home!', function(err){
            strategy._loadUserProfile.restore();
            if (err) {
              done(err)
            }
            else {
              redditAuth.done();
              done();
            }
          })
      });
    });
  });

  describe('authorization redirect parameters', function(){
    describe('duration', function(){
      it('should not be present by default', function(done){
        request(app)
          .get('/auth/reddit')
          .expect(302)
          .end(function(err, res){
            if (err) done(err);
            else {
              res.headers.location.indexOf('duration').should.equal(-1);
              done();
            }
          });
      });

      it('should be set from passport strategy options', function(done){
        request(app)
          .get('/auth/reddit_with_duration')
          .expect('Location', new RegExp('duration=' + duration))
          .expect(302, done)
      });
    });
  });
});
