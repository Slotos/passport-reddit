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

    describe('when told to load user profile', function(){
        describe('on success', function(){
            before(function(){
                sinon.stub(strategy._oauth2, "get", function(url, accessToken, callback) {
                    var body = JSON.stringify({
                        "name": "redditor",
                        "link_karma": 100,
                        "comment_karma": 900
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
