.PHONY: run, lint, test, deploy

CMD ?= 

all: install

install: .install
.install: package.json
	@# make sure you have default system's python 2.7, not from venv
	@# npm package "sass" will use python with print statment (not function) !
	npm install
	touch $@

run: install
	npm run devserver

lint:
	npm run lint

test-only:
	node test/binarySearch.js

test: lint test-only

build-dev:
	npm run build-dev

build-prod:
	npm run build-prod

serve-dist:
	cd dist/ && python -m SimpleHTTPServer 8080

workbox:
	./node_modules/workbox-cli/build/bin.js $(CMD)
