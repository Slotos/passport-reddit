/**
 * Module dependencies.
 */
var querystring = require('querystring')
  , util = require('util')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy
  , InternalOAuthError = require('passport-oauth').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The Reddit authentication strategy authenticates requests by delegating to
 * Reddit using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Reddit application's client id
 *   - `clientSecret`  your Reddit application's client secret
 *   - `callbackURL`   URL to which Reddit will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new RedditStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/reddit/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://ssl.reddit.com/api/v1/authorize';
  options.tokenURL = options.tokenURL || 'https://ssl.reddit.com/api/v1/access_token';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'reddit';
  this._userProfileURL = options.userProfileURL || 'https://ssl.reddit.com/api/v1/me';

  // Reddit token endpoint expects basic auth header "with the consumer key as the username
  // and the consumer secret as the password". To comply we are resorting to overriding
  // node-oauth's implmentation of getOAuthAccessToken().
  this._oauth2.getOAuthAccessToken = function(code, params, callback) {
    var params= params || {};
    params['client_id'] = this._clientId;
    params['client_secret'] = this._clientSecret;
    params['type']= 'web_server';
    params['code']= code;

    var post_data= querystring.stringify( params );
    var post_headers= {
         'Content-Type': 'application/x-www-form-urlencoded'
    };


    this._request("POST", this._getAccessTokenUrl(), post_headers, post_data, null, function(error, data, response) {
      if( error )  callback(error);
      else {
        var results;
        results= JSON.parse( data );
        var access_token= results["access_token"]["token"];
        callback(null, access_token);
      }
    });
  }
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);


/**
 * Retrieve user profile from Reddit.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `reddit`
 *   - `name`
 *   - `link_karma`
 *   - `comment_karma`
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  this._oauth2.get(this._userProfileURL, accessToken, function (err, body, res) {
    if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

    try {
      var json = JSON.parse(body);

      var profile = { provider: 'reddit' };
      profile.name = json.name;
      profile.link_karma = json.link_karma;
      profile.comment_karma = json.comment_karma;

      profile._raw = body;
      profile._json = json;

      done(null, profile);
    } catch(e) {
      done(e);
    }
  });
}


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
