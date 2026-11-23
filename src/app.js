import { STRINGS, LANGS } from './i18n.js';

// --- Estado de la aplicación ---
const MIN_BASE = 1;
const MAX_BASE = 10;
const state = {
    base: 3,
    exponent: 1,
    lang: 'es',
    labels: true,
    slice: 0,      // 0 = todas las capas (solo 3D)
    progress: 1,   // avance de la animación de construcción (0..1)
};

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => reducedMotionQuery.matches;

// --- Elementos del DOM ---
const $ = (id) => document.getElementById(id);
const baseSlider = $('base-slider');
const baseValue = $('base-value');
const sliceGroup = $('slice-group');
const sliceSlider = $('slice-slider');
const sliceValue = $('slice-value');
const labelsToggle = $('labels-toggle');
const labelsOption = $('labels-option');
const buildBtn = $('build-btn');
const resetCameraBtn = $('reset-camera-btn');
const mathOutput = $('math-output');
const mathSteps = $('math-steps');
const mathRoot = $('math-root');
const dimensionText = $('dimension-text');
const appsBody = $('apps-body');
const expRadios = [...document.querySelectorAll('input[name="exponent"]')];
const langButtons = [...document.querySelectorAll('.lang-btn')];
const canvas2d = $('canvas-2d');
const container3d = $('canvas-3d');
const error3d = $('error-3d');
const error3dText = $('error-3d-text');
const retry3dBtn = $('retry-3d-btn');
const viewportContainer = $('viewport-container');
const scrollToTopBtn = $('scroll-to-top');
const ctx2d = canvas2d.getContext('2d');

const t = () => STRINGS[state.lang];

// --- Algoritmo de coloración por unidad (gama HSL dinámica) ---
// Da a cada unidad un color diferenciado de sus vecinas. Con muchas unidades
// (hasta 1000 en el cubo de base 10) algunos colores se repiten inevitablemente.
function getUnitColor(index, alpha = 1.0) {
    const N = 8; // Dividir el espectro en 8 colores principales
    const hIndex = index % N;
    const cycleIndex = Math.floor(index / N);

    // Tonalidad base distribuida en los 360 grados.
    // Rotamos 17 grados por ciclo para que el siguiente ciclo no repita exactamente los colores.
    const hue = (hIndex * (360 / N) + cycleIndex * 17) % 360;

    // Variaciones sutiles de saturación y luminosidad por ciclo
    const saturation = 85 - (cycleIndex * 5) % 15; // 85 %, 80 % o 75 %
    const lightness = 50 + (cycleIndex * 7) % 15 - 7; // entre 43 % y 57 %

    return {
        css: `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`,
        cssOpaque: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        hue,
        saturation,
        lightness,
    };
}

// --- Estado en la URL (#b=4&e=3&lang=en) para compartir ejemplos ---
function readHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    const b = parseInt(params.get('b'), 10);
    const e = parseInt(params.get('e'), 10);
    const lang = params.get('lang');
    if (b >= MIN_BASE && b <= MAX_BASE) state.base = b;
    if (e >= 0 && e <= 3) state.exponent = e;
    if (LANGS.includes(lang)) state.lang = lang;
}

function writeHash() {
    const params = new URLSearchParams({ b: state.base, e: state.exponent, lang: state.lang });
    history.replaceState(null, '', `#${params}`);
}

function detectLanguage() {
    try {
        const saved = localStorage.getItem('lang');
        if (LANGS.includes(saved)) return saved;
    } catch { /* almacenamiento no disponible */ }
    const preferred = (navigator.languages || [navigator.language]).map((l) => l.slice(0, 2));
    return preferred.find((l) => LANGS.includes(l)) || 'es';
}

// --- Textos ---
function applyStaticTexts() {
    const s = t();
    document.documentElement.lang = state.lang;
    document.title = s.pageTitle;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = s[el.dataset.i18n];
    });
    expRadios.forEach((radio) => {
        radio.parentElement.querySelector('.exp-name').textContent = s.dimNames[Number(radio.value)];
    });
    appsBody.innerHTML = s.appsBody; // contenido estático propio (i18n.js)
    error3dText.textContent = s.error3d;
    langButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.lang === state.lang)));
}

function updateMath() {
    const s = t();
    const B = state.base;
    const E = state.exponent;
    const result = B ** E;

    mathOutput.innerHTML = `${B}<sup>${E}</sup> = ${result}`;
    mathSteps.textContent = s.steps(B, E, result);

    if (E === 0) {
        mathRoot.innerHTML = `<sup>0</sup>√1 <span class="math-note">${s.rootUndefined}</span>`;
    } else {
        // Ejemplo: ∛27 = 27^(1/3) = 3, con la fracción del exponente apilada verticalmente
        const rootSymbol = { 1: '<sup>1</sup>√', 2: '√', 3: '∛' }[E];
        mathRoot.innerHTML = `${rootSymbol}${result} = ${result}<span class="super-fraction" aria-label="1/${E}"><span class="fraction-num">1</span><span class="fraction-den">${E}</span></span> = ${B}`;
    }

    const description = s.describe(B, E, result, E === 3 ? state.slice : 0);
    dimensionText.textContent = description;
    canvas2d.setAttribute('aria-label', description);
    container3d.setAttribute('aria-label', description);
}

function updateControls() {
    const s = t();
    const E = state.exponent;
    baseSlider.value = state.base;
    baseValue.textContent = state.base;

    expRadios.forEach((radio) => {
        radio.checked = Number(radio.value) === E;
        radio.parentElement.classList.toggle('active', radio.checked);
    });

    sliceGroup.hidden = E !== 3;
    sliceSlider.max = state.base;
    sliceSlider.value = state.slice;
    sliceValue.textContent = state.slice === 0 ? s.sliceAll : `${state.slice}/${state.base}`;

    labelsOption.hidden = E === 3;
    labelsToggle.checked = state.labels;
    resetCameraBtn.hidden = E !== 3;
    buildBtn.disabled = E === 0;
}

// --- Dibujo 0D, 1D y 2D en canvas ---
function setupCanvas() {
    const W = viewportContainer.clientWidth;
    const H = viewportContainer.clientHeight;
    // Resolución física según la densidad de píxeles para que no se vea borroso
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas2d.width = Math.round(W * dpr);
    canvas2d.height = Math.round(H * dpr);
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2d.clearRect(0, 0, W, H);
    return { W, H };
}

const FONT = '"Fira Code", monospace';
const LABEL_COLOR = '#e1e1e6';
const AXIS_COLOR = '#a1a1aa';

function draw2D() {
    const { W, H } = setupCanvas();
    if (!W || !H) return;
    const ctx = ctx2d;
    const B = state.base;
    const p = state.progress;
    const centerX = W / 2;
    const centerY = H / 2;

    if (state.exponent === 0) {
        // RENDERIZADO 0D: un único punto
        const color = getUnitColor(0).cssOpaque;
        const radius = 10 * p;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(radius, 0.5), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 18;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (state.labels) {
            ctx.font = `600 14px ${FONT}`;
            ctx.fillStyle = LABEL_COLOR;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('1', centerX, centerY + 22);
        }
        return;
    }

    if (state.exponent === 1) {
        // RENDERIZADO 1D: línea con marcas unitarias y etiquetas
        const padding = Math.min(80, W * 0.08);
        const unitSize = Math.max(Math.min((W - padding * 2) / B, 120), 1);
        const totalLength = B * unitSize;
        const startX = centerX - totalLength / 2;
        const endX = centerX + totalLength / 2;
        // Segmentos visibles (fraccionario durante la animación: la línea crece desde el punto)
        const shown = p * B;
        const fontSize = Math.max(10, Math.min(14, unitSize * 0.5));
        const showUnitLabels = state.labels && unitSize >= 30;

        // Eje de referencia de fondo
        ctx.beginPath();
        ctx.moveTo(startX - 20, centerY);
        ctx.lineTo(endX + 20, centerY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Marcas (ticks) y números de la línea
        for (let i = 0; i <= Math.floor(shown); i++) {
            const x = startX + i * unitSize;
            ctx.beginPath();
            ctx.moveTo(x, centerY - 12);
            ctx.lineTo(x, centerY + 12);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

            if (state.labels) {
                ctx.font = `600 ${fontSize}px ${FONT}`;
                ctx.fillStyle = LABEL_COLOR;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(i, x, centerY + 22);
            }
        }

        // Segmentos de colores encima
        for (let i = 0; i < Math.ceil(shown); i++) {
            const x = startX + i * unitSize;
            const fraction = Math.min(1, shown - i);
            const color = getUnitColor(i).cssOpaque;

            ctx.beginPath();
            ctx.moveTo(x, centerY);
            ctx.lineTo(x + unitSize * fraction, centerY);
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
            ctx.stroke();
            ctx.shadowBlur = 0;

            if (fraction < 1) continue;

            // Indicador de unidad ("1 u") y llave superior de su color
            if (showUnitLabels) {
                ctx.font = `600 11px ${FONT}`;
                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(t().unitLabel, x + unitSize / 2, centerY - 25);
            }
            const inset = Math.min(6, unitSize / 4);
            ctx.beginPath();
            ctx.moveTo(x + inset, centerY - 12);
            ctx.lineTo(x + inset, centerY - 18);
            ctx.lineTo(x + unitSize - inset, centerY - 18);
            ctx.lineTo(x + unitSize - inset, centerY - 12);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        return;
    }

    // RENDERIZADO 2D: cuadrícula B × B con ejes y celdas multicolores
    const padding = Math.min(90, Math.min(W, H) * 0.12);
    const unitSize = Math.max(Math.min((W - padding * 2) / B, (H - padding * 2) / B, 100), 1);
    const gridSize = B * unitSize;
    const startX = centerX - gridSize / 2;
    const startY = centerY - gridSize / 2;
    const bottomY = centerY + gridSize / 2;
    // Filas visibles: se parte de la línea 1D (fila 0) y se copia hacia arriba
    const rows = 1 + p * (B - 1);
    const showCoords = state.labels && unitSize >= 24;
    const coordFont = Math.min(11, Math.max(9, unitSize / 4));

    for (let y = 0; y < Math.ceil(rows); y++) {
        const alpha = Math.min(1, rows - y);
        ctx.globalAlpha = alpha;
        for (let x = 0; x < B; x++) {
            const cellX = startX + x * unitSize;
            // El eje Y sube, por lo que y = 0 es la fila inferior
            const cellY = bottomY - (y + 1) * unitSize;
            const index = y * B + x;
            const cellColor = getUnitColor(index);

            ctx.fillStyle = getUnitColor(index, 0.16).css;
            const inset = Math.min(2, unitSize / 8);
            ctx.fillRect(cellX + inset, cellY + inset, unitSize - inset * 2, unitSize - inset * 2);

            ctx.strokeStyle = getUnitColor(index, 0.55).css;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cellX, cellY, unitSize, unitSize);

            if (showCoords) {
                ctx.font = `600 ${coordFont}px ${FONT}`;
                ctx.fillStyle = cellColor.cssOpaque;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${x},${y}`, cellX + unitSize / 2, cellY + unitSize / 2);
            }
        }
    }
    ctx.globalAlpha = 1;

    // Borde exterior del cuadrado completo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(startX, startY, gridSize, gridSize);

    // Eje X (horizontal en la base) y eje Y (vertical a la izquierda)
    const overhang = Math.min(30, padding / 2);
    ctx.beginPath();
    ctx.moveTo(startX - overhang, bottomY);
    ctx.lineTo(startX + gridSize + overhang, bottomY);
    ctx.moveTo(startX, bottomY + overhang);
    ctx.lineTo(startX, startY - overhang);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const axisFont = Math.max(10, Math.min(12, unitSize * 0.5));
    for (let i = 0; i <= B; i++) {
        const x = startX + i * unitSize;
        const y = bottomY - i * unitSize;

        ctx.beginPath();
        ctx.moveTo(x, bottomY);
        ctx.lineTo(x, bottomY + 8);
        ctx.moveTo(startX, y);
        ctx.lineTo(startX - 8, y);
        ctx.strokeStyle = AXIS_COLOR;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (state.labels) {
            ctx.font = `600 ${axisFont}px ${FONT}`;
            ctx.fillStyle = LABEL_COLOR;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(i, x, bottomY + 12);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(i, startX - 14, y);
        }
    }
}

// --- Vista 3D (carga diferida de Three.js) ---
let scene3d = null;
let scene3dPromise = null;

function load3D() {
    if (!scene3dPromise) {
        scene3dPromise = import('./scene3d.js')
            .then(({ createScene3D }) => {
                scene3d = createScene3D(container3d, { getUnitColor, reducedMotion: reducedMotion() });
                scene3d.setBase(state.base);
                return scene3d;
            })
            .catch((err) => {
                console.error(err);
                scene3dPromise = null; // permitir reintentar
                throw err;
            });
    }
    return scene3dPromise;
}

async function show3D() {
    error3d.hidden = true;
    try {
        await load3D();
    } catch {
        if (state.exponent === 3) error3d.hidden = false;
        return;
    }
    if (state.exponent !== 3) return; // el usuario cambió de vista mientras cargaba
    scene3d.setSlice(state.slice);
    scene3d.setProgress(state.progress);
    scene3d.start();
}

// --- Render general ---
function render() {
    updateControls();
    updateMath();

    const is3D = state.exponent === 3;
    canvas2d.classList.toggle('active', !is3D);
    container3d.classList.toggle('active', is3D);
    if (!is3D) error3d.hidden = true;

    if (is3D) {
        show3D();
    } else {
        scene3d?.stop();
        draw2D();
    }
}

// --- Animación de construcción: cada dimensión se forma copiando la anterior ---
let buildFrame = 0;

function stopBuild() {
    cancelAnimationFrame(buildFrame);
    buildFrame = 0;
    state.progress = 1;
}

function playBuild() {
    stopBuild();
    if (state.exponent === 0 || reducedMotion()) {
        render();
        return;
    }
    const duration = Math.min(Math.max(state.base * 350, 800), 3000);
    const start = performance.now();
    const step = (now) => {
        state.progress = Math.min(1, (now - start) / duration);
        if (state.exponent === 3) {
            scene3d?.setProgress(state.progress);
        } else {
            draw2D();
        }
        buildFrame = state.progress < 1 ? requestAnimationFrame(step) : 0;
    };
    state.progress = 0;
    render();
    buildFrame = requestAnimationFrame(step);
}

// --- Acciones ---
function setExponent(E) {
    if (E === state.exponent) return;
    state.exponent = E;
    writeHash();
    playBuild();
}

function setBase(B) {
    if (B === state.base) return;
    stopBuild();
    state.base = B;
    state.slice = Math.min(state.slice, B);
    scene3d?.setBase(B);
    writeHash();
    render();
}

function setLang(lang) {
    if (lang === state.lang) return;
    state.lang = lang;
    try { localStorage.setItem('lang', lang); } catch { /* sin almacenamiento */ }
    writeHash();
    applyStaticTexts();
    render();
}

// --- Eventos ---
baseSlider.addEventListener('input', () => setBase(parseInt(baseSlider.value, 10)));

sliceSlider.addEventListener('input', () => {
    state.slice = parseInt(sliceSlider.value, 10);
    scene3d?.setSlice(state.slice);
    updateControls();
    updateMath();
});

labelsToggle.addEventListener('change', () => {
    state.labels = labelsToggle.checked;
    if (state.exponent !== 3) draw2D();
});

buildBtn.addEventListener('click', playBuild);
resetCameraBtn.addEventListener('click', () => scene3d?.resetCamera());
retry3dBtn.addEventListener('click', show3D);
langButtons.forEach((btn) => btn.addEventListener('click', () => setLang(btn.dataset.lang)));

// Selector de dimensión: radios nativos (clic o flechas del teclado)
expRadios.forEach((radio) => {
    radio.addEventListener('change', () => setExponent(Number(radio.value)));
});

window.addEventListener('hashchange', () => {
    const prev = { ...state };
    readHash();
    if (state.lang !== prev.lang) applyStaticTexts();
    if (state.base !== prev.base) scene3d?.setBase(state.base);
    state.slice = Math.min(state.slice, state.base);
    stopBuild();
    render();
});

// Redibujar al cambiar el tamaño del área de visualización (sin reiniciar la cámara 3D)
new ResizeObserver(() => {
    if (state.exponent === 3) scene3d?.resize();
    else draw2D();
}).observe(viewportContainer);

// Botón "volver a controles" en móvil y pantallas bajas
window.addEventListener('scroll', () => {
    scrollToTopBtn.classList.toggle('visible', window.scrollY > 180);
}, { passive: true });

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
});

// --- Carga inicial ---
state.lang = detectLanguage();
readHash();
applyStaticTexts();
render();

// El canvas no se actualiza solo cuando llega la fuente web: redibujar al cargarla
document.fonts?.load(`600 12px ${FONT}`).then(() => {
    if (state.exponent !== 3) draw2D();
});
