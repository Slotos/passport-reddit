require('should');
var reddit = require('passport-reddit');

describe('passport-reddit', function(){
  describe('module', function(){
    it('should report a version', function(){
      reddit.version.should.be.a('string');
    });
  });
});
