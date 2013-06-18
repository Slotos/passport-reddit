/**
 * Module dependencies.
 */
var querystring = require('querystring'),
    util = require('util'),
    OAuth2Strategy = require('passport-oauth').OAuth2Strategy,
    InternalOAuthError = require('passport-oauth').InternalOAuthError;


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

    // ensuring we request identity scope
    // sacrificing efficiency due to one-time nature of this
    if (options.scope) {
        if (Array.isArray(options.scope)) {
            options.scope.push('identity');
            options.scopeSeparator = ',';
        }
        else {
            options.scope = options.scope.
                split(',').
                reduce(function(previousValue, currentValue, index, array){
                    if (currentValue !== '') previousValue.push(currentValue);
                    return previousValue;
                }, ['identity']).join(',');
        }
    }
    else {
        options.scope = 'identity';
    }

    OAuth2Strategy.call(this, options, verify);
    this.name = 'reddit';
    this._userProfileURL = options.userProfileURL || 'https://oauth.reddit.com/api/v1/me';
    // Reddit requires Auth token in GET requests
    this._oauth2._useAuthorizationHeaderForGET = true;

    // Reddit token endpoint expects basic auth header "with the consumer key as the username
    // and the consumer secret as the password". To comply we are resorting to overriding
    // node-oauth's implmentation of getOAuthAccessToken().
    this._oauth2.getOAuthAccessToken = function(code, params, callback) {
        var params = params || {};
        params.type= 'web_server';
        var codeParam = (params.grant_type === 'refresh_token') ? 'refresh_token' : 'code';
        params[codeParam]= code;

        var post_data= querystring.stringify( params );
        var authorization = "Basic " + Buffer("" + this._clientId + ":" + this._clientSecret).toString('base64');
        var post_headers= {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization' : authorization
        };

        this._request("POST", this._getAccessTokenUrl(), post_headers, post_data, null, function(error, data, response) {
            if( error )  callback(error);
            else {
                var results = JSON.parse( data );
                var access_token = results.access_token;
                var refresh_token = results.refresh_token;
                delete results.refresh_token;
                callback(null, access_token, refresh_token, results); // callback results =-=
            }
        });
    };
}


/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);


/**
 * Return extra Reddit-specific parameters to be included in the authorization
 * request.
 *
 * Options:
 *  - `duration`  Optional request for a permanent token, { `temporary`, `permanent` }.
 *
 * @param {Object} options
 * @return {Object}
 * @api protected
 */
Strategy.prototype.authorizationParams = function (options) {
    var params = {},
        duration = options.duration;

    if (duration) {
        params['duration'] = duration;
    }

    return params;
};


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
            profile.id = json.id;
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
};


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
