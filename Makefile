.PHONY: clean all test watch document

PATH  := node_modules/.bin:$(PATH)
SHELL := /bin/bash

source_files       := src/pie.js src/extensions/*.js src/mixins/*.js src/base.js src/app.js src/model.js src/config.js src/view.js src/activeView.js src/ajaxRequest.js src/ajax.js src/cache.js src/emitter.js src/errorHandler.js src/formView.js src/helpers.js src/i18n.js src/list.js src/listView.js src/navigator.js src/notifier.js src/resources.js src/route.js src/router.js src/routeHandler.js src/templates.js src/validator.js src/viewTransition.js
amd_files          := src/amd/*.txt
deploy             := build/pie.js.min
debug              := build/pie.js
gzip               := build/pie.js.min.gz

spec_source_files  := spec/specHelper.js spec/**/*Spec.js spec/*Spec.js
specs              := spec/compiled.js

guide_source_files := docs/guide/js/app.js docs/guide/js/gist.js docs/guide/js/highlight.js
guide_debug        := docs/guide/js/compiled.js


all: clean $(debug) $(specs) $(guide) $(deploy) $(guide_debug) document

$(deploy): $(debug)
	uglifyjs -cmo $(deploy) $(debug)
	gzip -c $(deploy) > $(gzip)

$(debug): $(source_files) $(amd_files)
	mkdir -p build
	cat src/amd/begin.txt $(source_files) src/amd/version.txt src/amd/end.txt > $(debug)

$(guide_pie): $(debug)
	cp $(debug) $(guide_pie)

$(guide_debug): $(guide_source_files)
	cat $(guide_source_files) > $(guide_debug)

$(specs): $(spec_source_files)
	cat $(spec_source_files) > $(specs)

test: $(deploy)
	open specRunner.html

spec: $(deploy)
	open specRunner.html

clean:
	rm -rf build

document: $(debug)
	docco -o docs/annotated/ $(debug)
	node docs/docco-index.js

watch: $(source_files) $(amd_files) $(guide_source_files) $(spec_source_files)
	fswatch -o $^ | xargs -n1 -I{} make

