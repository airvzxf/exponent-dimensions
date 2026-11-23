// Prueba de humo en un Chrome real (headless).
//
// Uso:
//   node tests/smoke.mjs                       # sirve src/ en un puerto local
//   BASE_URL=https://exponent-dimensions.rovisoft.net/ node tests/smoke.mjs
//
// CHROME_PATH elige el ejecutable; si no se define, se busca uno conocido.
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const SRC = resolve(fileURLToPath(new URL('../src', import.meta.url)));
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
};

function serveSrc() {
    const server = createServer(async (req, res) => {
        const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        const file = normalize(join(SRC, path.endsWith('/') ? `${path}index.html` : path));
        if (!file.startsWith(SRC + sep)) {
            res.writeHead(403).end();
            return;
        }
        try {
            const body = await readFile(file);
            res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }).end(body);
        } catch {
            res.writeHead(404).end();
        }
    });
    return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

function findChrome() {
    const candidates = [
        process.env.CHROME_PATH,
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ].filter(Boolean);
    const found = candidates.find((p) => existsSync(p));
    if (!found) throw new Error(`No se encontró Chrome; define CHROME_PATH (probados: ${candidates.join(', ')})`);
    return found;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
let passes = 0;

function check(name, condition, detail = '') {
    if (condition) {
        passes++;
        console.log(`  ✓ ${name}`);
    } else {
        failures++;
        console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
    }
}

// Registra errores de consola, excepciones y peticiones fallidas de una página
function watch(page, { ignore = () => false } = {}) {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error' && !ignore(m.text())) errors.push(`console: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => { if (!ignore(r.url())) errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`); });
    return errors;
}

const text = (page, id) => page.$eval(`#${id}`, (el) => el.textContent.replace(/\s+/g, ' ').trim());

async function open(page, base, hash, wait = 600) {
    await page.goto(`${base}#${hash}`, { waitUntil: 'networkidle0' });
    await sleep(wait);
}

const server = process.env.BASE_URL ? null : await serveSrc();
const BASE = process.env.BASE_URL || `http://127.0.0.1:${server.address().port}/`;
console.log(`Probando ${BASE}`);

const browser = await puppeteer.launch({
    executablePath: findChrome(),
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    const errors = watch(page);

    console.log('Dimensiones y panel matemático');
    const cases = [
        { b: 3, e: 0, power: '30 = 1', root: 'no está definida' },
        { b: 5, e: 1, power: '51 = 5', root: '1√5 = 511 = 5' },
        { b: 4, e: 2, power: '42 = 16', root: '√16 = 1612 = 4' },
        { b: 4, e: 3, power: '43 = 64', root: '∛64 = 6413 = 4' },
    ];
    for (const c of cases) {
        await open(page, BASE, `b=${c.b}&e=${c.e}&lang=es`, c.e === 3 ? 2500 : 600);
        check(`${c.e}D potencia "${c.power}"`, (await text(page, 'math-output')) === c.power, await text(page, 'math-output'));
        check(`${c.e}D raíz contiene "${c.root}"`, (await text(page, 'math-root')).includes(c.root), await text(page, 'math-root'));
        const checked = await page.$eval('input[name="exponent"]:checked', (el) => el.value);
        check(`${c.e}D radio marcado`, checked === String(c.e), checked);
    }

    console.log('Vista 3D');
    const has3d = await page.$eval('#canvas-3d', (el) => {
        const canvas = el.querySelector('canvas');
        return el.classList.contains('active') && !!canvas && canvas.width > 0 && canvas.height > 0;
    });
    check('3D crea un canvas WebGL visible', has3d);
    check('3D sin mensaje de error', await page.$eval('#error-3d', (el) => el.hidden));
    await page.$eval('#slice-slider', (s) => { s.value = 2; s.dispatchEvent(new Event('input')); });
    check('corte actualiza el valor', (await text(page, 'slice-value')) === '2/4', await text(page, 'slice-value'));
    check('corte actualiza la descripción', (await text(page, 'dimension-text')).includes('Corte 2 de 4'));

    console.log('Controles');
    await open(page, BASE, 'b=3&e=1&lang=es');
    await page.$eval('#base-slider', (s) => { s.value = 7; s.dispatchEvent(new Event('input')); });
    check('slider de base actualiza la URL', page.url().includes('b=7'), page.url());
    check('slider de base actualiza la potencia', (await text(page, 'math-output')) === '71 = 7');
    await page.focus('input[name="exponent"]:checked');
    await page.keyboard.press('ArrowRight');
    await sleep(300);
    check('flecha derecha pasa a 2D', page.url().includes('e=2'), page.url());
    await page.click('.lang-btn[data-lang="en"]');
    check('cambio de idioma a inglés', (await page.$eval('html', (h) => h.lang)) === 'en'
        && (await text(page, 'math-steps')).startsWith('Operation:'));
    check('título traducido', (await page.title()).startsWith('Powers in Dimensions'), await page.title());

    check('sin errores de consola ni de red', errors.length === 0, errors.join(' | '));

    console.log('Móvil');
    const mobile = await browser.newPage();
    const mobileErrors = watch(mobile);
    await mobile.setViewport({ width: 360, height: 740, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await open(mobile, BASE, 'b=10&e=2&lang=es');
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('sin scroll horizontal a 360 px', overflow <= 0, `${overflow}px de más`);
    const canvasPixels = await mobile.$eval('#canvas-2d', (c) => c.width);
    check('canvas a resolución física (DPR 2)', canvasPixels >= 700, `${canvasPixels}px`);
    check('móvil sin errores', mobileErrors.length === 0, mobileErrors.join(' | '));

    console.log('CDN de Three.js caído');
    const offline = await browser.newPage();
    watch(offline, { ignore: () => true });
    await offline.setRequestInterception(true);
    offline.on('request', (r) => (r.url().includes('cdn.jsdelivr.net') ? r.abort() : r.continue()));
    await open(offline, BASE, 'b=3&e=3&lang=es', 1500);
    check('muestra el aviso con "Reintentar"', !(await offline.$eval('#error-3d', (el) => el.hidden)));
} finally {
    await browser.close();
    server?.close();
}

console.log(`\n${passes} correctas, ${failures} fallidas`);
process.exit(failures ? 1 : 0);
