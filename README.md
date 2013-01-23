# Passport-Yammer

[Passport](https://github.com/jaredhanson/passport) strategy for authenticating
with [Yammer](https://www.yammer.com/) using the OAuth 2.0 API.

This module lets you authenticate using Yammer in your Node.js applications.
By plugging into Passport, Yammer authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-yammer

## Usage

#### Configure Strategy

The Yammer authentication strategy authenticates users using a Yammer
account and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a client ID, client secret, and callback URL.

    passport.use(new YammerStrategy({
        clientID: YAMMER_CONSUMER_KEY,
        clientSecret: YAMMER_CONSUMER_SECRET,
        callbackURL: "http://127.0.0.1:3000/auth/yammer/callback"
      },
      function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({ yammerId: profile.id }, function (err, user) {
          return done(err, user);
        });
      }
    ));

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'yammer'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

    app.get('/auth/yammer',
      passport.authenticate('yammer'));

    app.get('/auth/yammer/callback', 
      passport.authenticate('yammer', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
      });

## Examples

For a complete, working example, refer to the [login example](https://github.com/jaredhanson/passport-yammer/tree/master/examples/login).

## Tests

    $ npm install --dev
    $ make test

[![Build Status](https://secure.travis-ci.org/jaredhanson/passport-yammer.png)](http://travis-ci.org/jaredhanson/passport-yammer)

## Credits

  - [Jared Hanson](http://github.com/jaredhanson)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2012-2013 Jared Hanson <[http://jaredhanson.net/](http://jaredhanson.net/)>
