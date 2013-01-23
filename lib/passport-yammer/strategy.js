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
 * The Yammer authentication strategy authenticates requests by delegating to
 * Yammer using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Yammer application's client id
 *   - `clientSecret`  your Yammer application's client secret
 *   - `callbackURL`   URL to which Yammer will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new YammerStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/yammer/callback'
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
  options.authorizationURL = options.authorizationURL || 'https://www.yammer.com/dialog/oauth';
  options.tokenURL = options.tokenURL || 'https://www.yammer.com/oauth2/access_token.json';
  
  OAuth2Strategy.call(this, options, verify);
  this.name = 'yammer';
  this._userProfileURL = options.userProfileURL || 'https://www.yammer.com/api/v1/users/current.json';
  
  // Despite claiming to support the OAuth 2.0 specification, Yammer's
  // implementation does anything but.  Yammer's token endpoint returns a
  // response that is so non-conformant that we are forced to resort to
  // extraordinary measures and override node-oauth's implmentation of
  // getOAuthAccessToken().
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
 * Retrieve user profile from Yammer.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `yammer`
 *   - `id`
 *   - `displayName`
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
      
      var profile = { provider: 'yammer' };
      profile.id = json.id;
      profile.displayName = json.full_name;
      
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
