var vows = require('vows');
var assert = require('assert');
var util = require('util');
var yammer = require('passport-yammer');


vows.describe('passport-yammer').addBatch({
  
  'module': {
    'should report a version': function (x) {
      assert.isString(yammer.version);
    },
  },
  
}).export(module);
