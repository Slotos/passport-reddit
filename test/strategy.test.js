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

    describe('token endpoint interaction', function(){
        it('should use basic auth header', function(){
            sinon.stub(strategy._oauth2, "_request");
            strategy._oauth2.getOAuthAccessToken('code', {}, undefined);

            (strategy._oauth2._request.firstCall.args[2].Authorization).should.exist;
            strategy._oauth2._request.restore();
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
