# Comandos del proyecto. El CI llama a estos mismos objetivos, así que
# `make check` en local valida lo mismo que GitHub Actions.

HTML_VALIDATE_VERSION := 11.18.0
LHCI_VERSION := 0.16.0
PORT ?= 8000

.PHONY: help serve lint html-validate js-check actionlint test test-deps smoke lighthouse check

help:
	@echo "make serve       Sirve src/ en http://localhost:$(PORT)"
	@echo "make lint        html-validate + sintaxis JS (+ actionlint si está instalado)"
	@echo "make smoke       Prueba de humo en Chrome headless (CHROME_PATH opcional)"
	@echo "make lighthouse  Lighthouse CI sobre src/"
	@echo "make check       lint + smoke"

serve:
	python3 -m http.server $(PORT) --directory src

lint: html-validate js-check
	@if command -v actionlint >/dev/null 2>&1; then $(MAKE) actionlint; \
	else echo "actionlint no está instalado; se omite (el CI sí lo ejecuta)"; fi

html-validate:
	npx --yes html-validate@$(HTML_VALIDATE_VERSION) src/index.html

js-check:
	@for f in src/*.js tests/*.mjs; do node --check "$$f" || exit 1; echo "ok $$f"; done

actionlint:
	actionlint -color

test-deps:
	npm ci --prefix tests --no-audit --no-fund

smoke: test-deps
	node tests/smoke.mjs

test: smoke

lighthouse:
	npx --yes @lhci/cli@$(LHCI_VERSION) autorun

check: lint smoke
