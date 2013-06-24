
build:
	@rm -rf dist
	@mkdir dist
	@sed "s/seajs-flush/seajs-flush-debug/" src/seajs-flush.js >dist/seajs-flush-debug.js
	@uglifyjs src/seajs-flush.js -o dist/seajs-flush.js -mc
	@make size

test:
	@make test -C ../seajs

size:
	@../seajs/tools/size.sh seajs-flush
