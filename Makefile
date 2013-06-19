# ==============================================================================
# Node Tests
# ==============================================================================

REPORTER = spec

test:
	@NODE_ENV=test NODE_PATH=lib ./node_modules/.bin/mocha \
		--reporter $(REPORTER)

integration:
	@NODE_ENV=test NODE_PATH=lib ./node_modules/.bin/mocha test/integration \
		--reporter $(REPORTER)

# Include both regular and integration tests into watch test
test-w:
	@NODE_ENV=test NODE_PATH=lib ./node_modules/.bin/mocha test test/integration \
		--reporter min \
		--grown \
		--watch

coverage:
	@NODE_ENV=test NODE_PATH=lib ./node_modules/.bin/mocha \
		--require blanket \
		--reporter html-cov > ./test/coverage.html

# I need both tests and coverage report here
coveralls:
	$(MAKE) test
	$(MAKE) integration
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
