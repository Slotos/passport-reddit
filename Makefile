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

# ==============================================================================
# Static Analysis
# ==============================================================================

JSHINT = jshint

hint: lint
lint:
	$(JSHINT) $(SOURCES)


.PHONY: test hint lint test-w nyan coverage
