import { expect } from 'chai'
import { stub } from 'sinon'
import { RedditStrategy } from '../lib/passport-reddit/index.js'

describe('RedditStrategy', function() {
  var it_should_handle_errors = function() {
    it('should error', function(done) {
      strategy.userProfile('something', function(err, _profile) {
        expect(err).to.exist
        done()
      })
    })

    it('should not load profile', function(done) {
      strategy.userProfile('something', function(_err, profile) {
        expect(profile).to.not.exist
        done()
      })
    })
  }

  var strategy = new RedditStrategy(
    {
      clientID: 'ABC123',
      clientSecret: 'secret'
    },
    function() { }
  )

  it('should be named reddit', function() {
    expect(strategy.name).to.equal('reddit')
  })

  it('should request use of auth header for GET requests', function() {
    expect(strategy._oauth2._useAuthorizationHeaderForGET).to.equal(true)
  })

  describe('scope', function() {
    it('should provide default', function() {
      expect(strategy._scope).to.equal('identity')
    })

    describe('stringified option', function() {
      it('should enforce comma separated identity scope presence', function() {
        expect(new RedditStrategy(
          {
            clientID: 'ABC123',
            clientSecret: 'secret',
            scope: 'one,two,,,five'
          },
          function() { }
        )._scope).to.match(/^identity,/)
      })
    })

    describe('array option', function() {
      var strategy

      before(function() {
        strategy = new RedditStrategy(
          {
            clientID: 'ABC123',
            clientSecret: 'secret',
            scope: ['one', 'two', 'five']
          },
          function() { }
        )
      })

      it('should enforce identity scope presence', function() {
        expect(strategy._scope).to.include('identity')
      })

      it('should enforce comma separator', function() {
        expect(strategy._scopeSeparator).to.equal(',')
      })
    })
  })

  describe('authorizationParams', function() {
    describe('duration', function() {
      var duration = 'to know recursion one must know recursion'
      var options = {}

      it('should not provide explicit default', function() {
        expect(strategy.authorizationParams(options).duration).to.not.exist
      })

      it('should accept duration through strategy options', function() {
        options.duration = duration
        expect(strategy.authorizationParams(options).duration).to.equal(duration)
      })
    })
  })

  describe('token endpoint interaction', function() {
    describe('authorization', function() {
      before(function() {
        stub(strategy._oauth2, "_request")
      })

      after(function() {
        strategy._oauth2._request.restore()
      })

      it('should use basic auth header', function() {
        strategy._oauth2.getOAuthAccessToken('code', {}, undefined)

        // checking oauth2._request arguments
        // third argument is headers hash
        // https://github.com/ciaranj/node-oauth/blob/301ebab90cde4c36ad1ac0bc7d814003f4e98432/lib/oauth2.js#L52
        expect(strategy._oauth2._request.firstCall.args[2].Authorization).to.exist
      })

      it('should authenticate using client id and client secret pair', function() {
        strategy._oauth2.getOAuthAccessToken('code', {}, undefined)

        var authHeader = strategy._oauth2._request.firstCall.args[2].Authorization
        var modelHeader = "Basic " + Buffer("" + strategy._oauth2._clientId + ":" + strategy._oauth2._clientSecret).toString('base64')

        expect(authHeader).to.equal(modelHeader)
      })
    })

    describe('on success', function() {
      before(function() {
        stub(strategy._oauth2, "_request").callsFake(function(_method, _url, _headers, _post_body, _access_token, callback) {
          var data = JSON.stringify({
            access_token: "access_token",
            refresh_token: "refresh_token",
            something_random: "randomness"
          })

          callback(null, data, null)
        })
      })

      after(function() {
        strategy._oauth2._request.restore()
      })

      it('should pass the data back', function(done) {
        strategy._oauth2.getOAuthAccessToken('code', {}, function(err, accessToken, refreshToken, _params) {
          expect(err).to.not.exist
          expect(accessToken).to.equal('access_token')
          expect(refreshToken).to.equal('refresh_token')
          done()
        })
      })
    })

    describe('on error', function() {
      before(function() {
        stub(strategy._oauth2, "_request").callsFake(function(_method, _url, _headers, _post_body, _access_token, callback) {
          callback("something bad has happened")
        })
      })

      after(function() {
        strategy._oauth2._request.restore()
      })

      it('should pass callback an error', function(done) {
        strategy._oauth2.getOAuthAccessToken('code', {}, function(err) {
          expect(err).to.equal("something bad has happened")
          done()
        })
      })
    })
  })

  describe('when told to load user profile', function() {
    describe('on success', function() {
      before(function() {
        stub(strategy._oauth2, "get").callsFake(function(_url, _accessToken, callback) {
          var body = JSON.stringify({
            "name": "redditor",
            "link_karma": 100,
            "comment_karma": 900,
            "id": "woohoo"
          })

          callback(null, body, undefined)
        })
      })

      after(function() {
        strategy._oauth2.get.restore()
      })

      it('should not error', function(done) {
        strategy.userProfile('something', function(err, _profile) {
          expect(err).to.not.exist
          done()
        })
      })

      it('should load profile', function(done) {
        strategy.userProfile('something', function(_err, profile) {
          expect(profile.provider).to.equal('reddit')
          expect(profile.name).to.equal('redditor')
          expect(profile.link_karma).to.equal(100)
          expect(profile.comment_karma).to.equal(900)
          expect(profile.id).to.equal("woohoo")
          done()
        })
      })

      it('should set raw property', function(done) {
        strategy.userProfile('something', function(_err, profile) {
          expect(profile._raw).to.be.a('string')
          done()
        })
      })

      it('should set json property', function(done) {
        strategy.userProfile('something', function(_err, profile) {
          expect(profile._json).to.be.a('object')
          done()
        })
      })
    })

    describe('on incorrect JSON answer', function() {
      before(function() {
        stub(strategy._oauth2, "get").callsFake(function(_url, _accessToken, callback) {
          var body = "I'm not a JSON, really!"

          callback(null, body, undefined)
        })
      })

      after(function() {
        strategy._oauth2.get.restore()
      })

      it_should_handle_errors()
    })

    describe('on API GET error', function() {
      before(function() {
        stub(strategy._oauth2, "get").callsFake(function(_url, _accessToken, callback) {
          callback(new Error('something-went-wrong'))
        })
      })

      after(function() {
        strategy._oauth2.get.restore()
      })

      it_should_handle_errors()

      it('should wrap error in InternalOAuthError', function(done) {
        strategy.userProfile('something', function(err, _profile) {
          expect(err.constructor.name).to.equal('InternalOAuthError')
          done()
        })
      })
    })
  })
})
