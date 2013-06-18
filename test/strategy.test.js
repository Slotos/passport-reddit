var should = require('should');
var sinon = require('sinon');
var reddit = require('passport-reddit');
var RedditStrategy = require('passport-reddit/strategy');

describe('RedditStrategy', function(){
    var it_should_handle_errors = function(){
        it('should error', function(done){
            strategy.userProfile('something', function(err, profile){
                should.exist(err);
                done();
            });
        });

        it('should not load profile', function(done){
            strategy.userProfile('something', function(err, profile){
                should.not.exist(profile);
                done();
            });
        });
    };

    var strategy = new RedditStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
    });

    it('should be named reddit', function(){
        strategy.name.should.equal('reddit');
    });

    it('should request use of auth header for GET requests', function(){
        strategy._oauth2._useAuthorizationHeaderForGET.should.equal(true);
    });

    describe('scope', function(){
        it('should provide default', function(){
            strategy._scope.should.equal('identity');
        });

        describe('stringified option', function(){
            it('should enforce comma separated identity scope presence', function(){
                new RedditStrategy({
                    clientID: 'ABC123',
                    clientSecret: 'secret',
                    scope: 'one,two,,,five'
                })._scope.should.match(/^identity,/);
            });
        });

        describe('array option', function(){
            var strategy;

            before(function(){
                strategy = new RedditStrategy({
                    clientID: 'ABC123',
                    clientSecret: 'secret',
                    scope: ['one','two','five']
                });
            });

            it('should enforce identity scope presence', function(){
               strategy._scope.should.include('identity');
            });

            it('should enforce comma separator', function(){
                strategy._scopeSeparator.should.equal(',');
            });
        });
    });

    describe('authorizationParams', function(){
        describe('duration', function(){
            var duration = 'to know recursion one must know recursion';
            var options = {};

            it('should not provide explicit default', function(){
                should.not.exist(strategy.authorizationParams(options).duration);
            });

            it('should accept duration through strategy options', function(){
                options.duration = duration;
                strategy.authorizationParams(options).duration.should.equal(duration);
            });
        });
    })

    describe('token endpoint interaction', function(){
        describe('authorization', function(){
            before(function(){
                sinon.stub(strategy._oauth2, "_request");
            });

            after(function(){
                strategy._oauth2._request.restore();
            });

            it('should use basic auth header', function(){
                strategy._oauth2.getOAuthAccessToken('code', {}, undefined);

                should.exist(strategy._oauth2._request.firstCall.args[2].Authorization);
            });

            it('should authenticate using client id and client secret pair', function(){
                strategy._oauth2.getOAuthAccessToken('code', {}, undefined);

                var authHeader = strategy._oauth2._request.firstCall.args[2].Authorization;
                var modelHeader = "Basic " + Buffer("" + strategy._oauth2._clientId + ":" + strategy._oauth2._clientSecret).toString('base64');

                authHeader.should.equal(modelHeader);
            });
        });

        describe('on success', function(){
            before(function(){
                sinon.stub(strategy._oauth2, "_request", function(method, url, headers, post_body, access_token, callback){
                    var data = JSON.stringify({
                        access_token: "access_token",
                        refresh_token: "refresh_token",
                        something_random: "randomness"
                    });

                    callback(null, data, null);
                });
            });

            after(function(){
                strategy._oauth2._request.restore();
            });

            it('should pass the data back', function(done){
                strategy._oauth2.getOAuthAccessToken('code', {}, function(err, accessToken, refreshToken, params){
                    should.not.exist(err);
                    accessToken.should.equal('access_token');
                    refreshToken.should.equal('refresh_token');
                    done();
                });
            });
        });

        describe('on error', function(){
            before(function(){
                sinon.stub(strategy._oauth2, "_request", function(method, url, headers, post_body, access_token, callback){
                    callback("something bad has happened");
                });
            });

            after(function(){
                strategy._oauth2._request.restore();
            });

            it('should pass callback an error', function(done){
                strategy._oauth2.getOAuthAccessToken('code', {}, function(err){
                    err.should.equal("something bad has happened");
                    done();
                });
            });
        });
    });

    describe('when told to load user profile', function(){
        describe('on success', function(){
            before(function(){
                sinon.stub(strategy._oauth2, "get", function(url, accessToken, callback) {
                    var body = JSON.stringify({
                        "name": "redditor",
                        "link_karma": 100,
                        "comment_karma": 900,
                        "id": "woohoo"
                    });

                    callback(null, body, undefined);
                });
            });

            after(function(){
                strategy._oauth2.get.restore();
            });

            it('should not error', function(done){
                strategy.userProfile('something', function(err, profile){
                    should.not.exist(err);
                    done();
                });
            });

            it('should load profile', function(done){
                strategy.userProfile('something', function(err, profile){
                    profile.provider.should.equal('reddit');
                    profile.name.should.equal('redditor');
                    profile.link_karma.should.equal(100);
                    profile.comment_karma.should.equal(900);
                    profile.id.should.equal("woohoo");
                    done();
                });
            });

            it('should set raw property', function(done){
                strategy.userProfile('something', function(err, profile){
                    profile._raw.should.be.a('string');
                    done();
                });
            });

            it('should set json property', function(done){
                strategy.userProfile('something', function(err, profile){
                    profile._json.should.be.a('object');
                    done();
                });
            });
        });

        describe('on incorrect JSON answer', function(){
            before(function(){
                sinon.stub(strategy._oauth2, "get", function(url, accessToken, callback) {
                    var body = "I'm not a JSON, really!";

                    callback(null, body, undefined);
                });
            });

            after(function(){
                strategy._oauth2.get.restore();
            });

            it_should_handle_errors();
        });

        describe('on API GET error', function(){
            before(function(){
                sinon.stub(strategy._oauth2, "get", function(url, accessToken, callback) {
                    callback(new Error('something-went-wrong'));
                });
            });

            after(function(){
                strategy._oauth2.get.restore();
            });

            it_should_handle_errors();

            it('should wrap error in InternalOAuthError', function(done){
                strategy.userProfile('something', function(err, profile){
                    err.constructor.name.should.equal('InternalOAuthError');
                    done();
                });
            });
        });
    });
});
