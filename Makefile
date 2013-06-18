# ==============================================================================
# Node Tests
# ==============================================================================

REPORTER = spec

test:
	@NODE_ENV=test NODE_PATH=lib ./node_modules/.bin/mocha \
		--reporter $(REPORTER)

test-w:
	@NODE_ENV=test NODE_PATH=lib ./node_modules/.bin/mocha \
		--reporter min \
		--watch

nyan:
	@NODE_ENV=test NODE_PATH=lib ./node_modules/.bin/mocha \
		--reporter nyan \
		--growl \
		--watch

coverage:
	@NODE_ENV=test NODE_PATH=lib ./node_modules/.bin/mocha \
		--require blanket \
		--reporter html-cov > ./test/coverage.html

coveralls:
	@NODE_ENV=test NODE_PATH=lib PASSPORT_REDDIT_COVERAGE=1 ./node_modules/.bin/mocha \
		--require blanket \
		--reporter mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

# ==============================================================================
# Static Analysis
# ==============================================================================

JSHINT = jshint
SOURCES = lib/passport-reddit

hint: lint
lint:
	$(JSHINT) $(SOURCES)


.PHONY: test hint lint test-w nyan coverage
