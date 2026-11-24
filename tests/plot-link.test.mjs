// Mapeo del enlace hacia exponent-plot: base 0–4 y exponente −4…4 allá;
// base 1–10 y exponente 0–3 aquí.
//
// Uso: make unit (node --test tests/*.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import { PLOT_URL, plotLink, power } from '../src/plot-link.js';

test('apunta a producción de exponent-plot', () => {
    assert.equal(PLOT_URL, 'https://exponent-plot.rovisoft.net/');
});

test('una base que cabe se conserva y no se marca como recortada', () => {
    for (let b = 1; b <= 4; b++) {
        for (let e = 0; e <= 3; e++) {
            const link = plotLink(b, e, 'es');
            assert.equal(link.url, `https://exponent-plot.rovisoft.net/#b=${b}&e=${e}&lang=es`);
            assert.equal(link.clipped, false, `${b}^${e}`);
        }
    }
});

test('una base mayor que 4 se recorta a 4 y se marca', () => {
    for (let b = 5; b <= 10; b++) {
        const link = plotLink(b, 3, 'en');
        assert.equal(link.url, 'https://exponent-plot.rovisoft.net/#b=4&e=3&lang=en');
        assert.deepEqual([link.base, link.exponent, link.clipped], [4, 3, true]);
    }
});

test('el caso de la prueba e2e: 7² en inglés → 4²', () => {
    assert.equal(plotLink(7, 2, 'en').url, 'https://exponent-plot.rovisoft.net/#b=4&e=2&lang=en');
});

test('el exponente se acota a −4…4 y la base a 0', () => {
    assert.equal(plotLink(-1, 9, 'es').url, 'https://exponent-plot.rovisoft.net/#b=0&e=4&lang=es');
    assert.equal(plotLink(2, -9, 'es').url, 'https://exponent-plot.rovisoft.net/#b=2&e=-4&lang=es');
    assert.equal(plotLink(2, -9, 'es').clipped, true);
});

test('el idioma actual viaja en el enlace', () => {
    assert.match(plotLink(3, 1, 'en').url, /&lang=en$/);
    assert.match(plotLink(3, 1, 'es').url, /&lang=es$/);
});

test('power() escribe el exponente en superíndice', () => {
    assert.equal(power(4, 3), '4³');
    assert.equal(power(1, 0), '1⁰');
    assert.equal(power(2, -2), '2⁻²');
});
