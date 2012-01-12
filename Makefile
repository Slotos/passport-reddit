NODE = node
TEST = ./node_modules/.bin/vows
TESTS ?= test/*-test.js

test:
	@NODE_ENV=test NODE_PATH=lib $(TEST) $(TEST_FLAGS) $(TESTS)

docs: docs/api.html

docs/api.html: lib/passport-yammer/*.js
	dox \
		--title Passport-Yammer \
		--desc "Yammer authentication strategy for Passport" \
		$(shell find lib/passport-yammer/* -type f) > $@

docclean:
	rm -f docs/*.{1,html}

.PHONY: test docs docclean
