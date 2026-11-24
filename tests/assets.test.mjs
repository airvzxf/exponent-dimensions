// El dominio de producción sirve CSS y JS con caché de navegador de un año
// (el HTML no se guarda). Cada versión cambia la URL de los recursos con
// ?v=<VERSION> para que nadie combine el HTML nuevo con un script viejo.
// Los import relativos entre módulos también llevan ?v=: si no, el módulo
// importado se quedaría en caché aunque cambie quien lo importa.
//
// Uso: make unit (node --test tests/*.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const VERSION = readFileSync(join(ROOT, 'VERSION'), 'utf8').trim();
const html = readFileSync(join(SRC, 'index.html'), 'utf8');
const modules = readdirSync(SRC).filter((f) => f.endsWith('.js')).sort();

// src="…" y href="…" de archivos .js o .css sin esquema (locales)
const htmlAssets = [...html.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css)(?:\?[^"]*)?)"/g)].map((m) => m[1]);

// import … from './x.js', import './x.js' e import('./x.js')
function relativeImports(file) {
    const code = readFileSync(join(SRC, file), 'utf8');
    const re = /(?:\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.{1,2}\/[^'"]+)\1/g;
    return [...code.matchAll(re)].map((m) => m[2]);
}

const imports = modules.flatMap((file) => relativeImports(file).map((spec) => ({ file, spec })));
const fileOf = (url) => url.split('?')[0].replace(/^\.\//, '');

test('VERSION es X.Y.Z', () => {
    assert.match(VERSION, /^\d+\.\d+\.\d+$/);
});

test('index.html carga styles.css y app.js', () => {
    assert.deepEqual(htmlAssets.map(fileOf).sort(), ['app.js', 'styles.css']);
});

test('cada recurso local de index.html lleva ?v=VERSION', () => {
    for (const url of htmlAssets) {
        assert.equal(url.split('?')[1], `v=${VERSION}`, url);
        assert.ok(existsSync(join(SRC, fileOf(url))), `falta src/${fileOf(url)}`);
    }
});

test('cada import relativo entre módulos lleva ?v=VERSION', () => {
    // Sin esto, la prueba pasaría también si la expresión regular dejara de encontrar imports
    assert.deepEqual(imports.map(({ spec }) => fileOf(spec)).sort(), ['i18n.js', 'scene3d.js']);
    for (const { file, spec } of imports) {
        assert.equal(spec.split('?')[1], `v=${VERSION}`, `${file}: ${spec}`);
        assert.ok(existsSync(join(SRC, fileOf(spec))), `${file}: falta src/${fileOf(spec)}`);
    }
});

test('todos los módulos de src/ se cargan con ?v= desde algún sitio', () => {
    const loaded = new Set([...htmlAssets, ...imports.map(({ spec }) => spec)].map(fileOf));
    assert.deepEqual(modules.filter((m) => !loaded.has(m)), []);
});
