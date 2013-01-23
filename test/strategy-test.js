var vows = require('vows');
var assert = require('assert');
var util = require('util');
var YammerStrategy = require('passport-yammer/strategy');


vows.describe('YammerStrategy').addBatch({
  
  'strategy': {
    topic: function() {
      return new YammerStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
    },
    
    'should be named yammer': function (strategy) {
      assert.equal(strategy.name, 'yammer');
    },
  },
  
  'strategy when loading user profile': {
    topic: function() {
      var strategy = new YammerStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
      
      // mock
      strategy._oauth2.get = function(url, accessToken, callback) {
        var body = '{ \
          "schools": [], \
          "kids_names": "", \
          "type": "user", \
          "previous_companies": [], \
          "verified_admin": "false", \
          "external_urls": [], \
          "network_name": "Yammer Developers Test Community", \
          "timezone": "Pacific Time (US & Canada)", \
          "expertise": "", \
          "network_id": 104604, \
          "stats": { \
            "updates": 0, \
            "following": 0, \
            "followers": 1 \
          }, \
          "url": "https://www.yammer.com/api/v1/users/4022983", \
          "interests": [], \
          "location": "", \
          "job_title": "MMMMMMMMMMMMMMMMMMMM", \
          "mugshot_url": "https://assets0.yammer.com/user_uploaded/photos/p1/0080/1548/DSCF2811_2_small.JPG", \
          "birth_date": "", \
          "significant_other": "", \
          "full_name": "Ilya Yakubovich", \
          "guid": null, \
          "network_domains": [], \
          "summary": "", \
          "state": "active", \
          "hire_date": null, \
          "name": "ilya", \
          "web_url": "https://www.yammer.com/yammerdeveloperstestcommunity/users/ilya", \
          "can_broadcast": "false", \
          "id": 4022983, \
          "contact": { \
            "email_addresses": [ \
              { \
                "type": "other", \
                "address": "ilya+yammerdeveloperstestcommunity@users.yammer.com" \
              } \
            ], \
            "im": { \
              "provider": "", \
              "username": "" \
            }, \
            "phone_numbers": [] \
          }, \
          "admin": "false" \
        }';
        
        callback(null, body, undefined);
      }
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },
      
      'should not error' : function(err, req) {
        assert.isNull(err);
      },
      'should load profile' : function(err, profile) {
        assert.equal(profile.provider, 'yammer');
        assert.equal(profile.id, '4022983');
        assert.equal(profile.displayName, 'Ilya Yakubovich');
      },
      'should set raw property' : function(err, profile) {
        assert.isString(profile._raw);
      },
      'should set json property' : function(err, profile) {
        assert.isObject(profile._json);
      },
    },
  },
  
  'strategy when loading user profile and encountering an error': {
    topic: function() {
      var strategy = new YammerStrategy({
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {});
      
      // mock
      strategy._oauth2.get = function(url, accessToken, callback) {
        callback(new Error('something-went-wrong'));
      }
      
      return strategy;
    },
    
    'when told to load user profile': {
      topic: function(strategy) {
        var self = this;
        function done(err, profile) {
          self.callback(err, profile);
        }
        
        process.nextTick(function () {
          strategy.userProfile('access-token', done);
        });
      },
      
      'should error' : function(err, req) {
        assert.isNotNull(err);
      },
      'should wrap error in InternalOAuthError' : function(err, req) {
        assert.equal(err.constructor.name, 'InternalOAuthError');
      },
      'should not load profile' : function(err, profile) {
        assert.isUndefined(profile);
      },
    },
  },
  
}).export(module);
