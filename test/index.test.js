import { expect } from 'chai'
import { version } from '../lib/passport-reddit/index.js'

describe('passport-reddit', function() {
  describe('module', function() {
    it('reports a version', function() {
      expect(version).to.be.a('string')
    })
  })
})
