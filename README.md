# Passport-Reddit [![Build Status](https://secure.travis-ci.org/Slotos/passport-reddit.png)](http://travis-ci.org/Slotos/passport-reddit) [![Coverage Status](https://coveralls.io/repos/Slotos/passport-reddit/badge.png)](https://coveralls.io/r/Slotos/passport-reddit)

[Passport](https://github.com/jaredhanson/passport) strategy for authenticating
with [Reddit](http://reddit.com/) using the OAuth 2.0 API.

This module lets you authenticate using Reddit in your Node.js applications.
By plugging into Passport, Reddit authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-reddit

## Usage

#### Configure Strategy

The Reddit authentication strategy authenticates users using a Reddit
account and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a client ID, client secret, and callback URL.

```javascript
passport.use(new RedditStrategy({
    clientID: REDDIT_CONSUMER_KEY,
    clientSecret: REDDIT_CONSUMER_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/reddit/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ redditId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'reddit'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```javascript
app.get('/auth/reddit', function(req, res, next){
  req.session.state = crypto.randomBytes(32).toString('hex');
  passport.authenticate('reddit', {
    state: req.session.state,
    duration: 'permanent',
  })(req, res, next);
});

app.get('/auth/reddit/callback', function(req, res, next){
  // Check for origin via state token
  if (req.query.state == req.session.state){
    passport.authenticate('reddit', {
      successRedirect: '/',
      failureRedirect: '/login'
    })(req, res, next);
  }
  else {
    next( new Error 403 );
  }
});
```

Notice the `state` option use
Reddit requires state, otherwise erring out.
I've decided to opt out of providing default state, since it kills the whole purpose of the flag.
If you don't want to use it, provide any string and don't check for it on user return.
If you think this is a stupid requirement, fill an issue with reddit.
Once they remove it, this middleware will simply work.

Also included is the optional `duration` parameter, to request a slightly longer authorization.
Defaults to `temporary` (1 hour).
Defined in the official [Reddit OAuth spec](https://github.com/reddit/reddit/wiki/OAuth2#authorization-parameters)

## Examples

For a complete, working example, refer to the [login example](https://github.com/slotos/passport-reddit/tree/master/examples/login).

## Tests

    $ npm install --dev
    $ make test

## Credits

  - [Jared Hanson](http://github.com/jaredhanson)
  - [Dmytro Soltys](http://github.com/slotos)
  - [Brian Partridge](http://github.com/bpartridge83)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Original work Copyright (c) 2012-2013 Jared Hanson <[http://jaredhanson.net/](http://jaredhanson.net/)>

Modified work Copyright (c) 2013 Dmytro Soltys <[http://slotos.net/](http://slotos.net/)>

Modified work Copyright (c) 2013 Brian Partridge <[http://brianpartridge.com/](http://brianpartridge.com/)>
