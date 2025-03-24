# Archival notice

**I don't use reddit anymore, this library is complete, but first and foremost, it implements a wrong thing correctly!**

[_OAuth2 is not an authentication protocol_](https://oauth.net/articles/authentication/) and you shoould not use this or any other library to _authenticate with reddit_.
Authenticating via OAuth2 can lead to attack escalation or even novel attacks for one simple reason - there's no authenticity information being exchanged between your app and the only party that could provide it when it matters in the OAuth2 flow.

**tl;dr** This library, just like many other OAuth2 login strategies, is a play-pretend and incomplete implementation of OpenID Connect written in the time when I didn't know better. _Do NOT authenticate with OAuth2!_

# Passport-Reddit [![Build Status](https://app.travis-ci.com/Slotos/passport-reddit.svg)](https://app.travis-ci.com/Slotos/passport-reddit) [![Coverage Status](https://codecov.io/gh/Slotos/passport-reddit/branch/main/graph/badge.svg)](https://codecov.io/gh/Slotos/passport-reddit)

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
  passport.authenticate('reddit', {
    duration: 'permanent',
  })(req, res, next);
});

app.get('/auth/reddit/callback', function(req, res, next){
  passport.authenticate('reddit', {
    successRedirect: '/',
    failureRedirect: '/login'
  })(req, res, next);
});
```

##### `duration` option on authenticate call

This strategy supports`duration` option on authenticate call, to request an indefinite authorization as opposed to 1 hour default.  
Possible values: `permanent` and `temporary` (1 hour).

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
