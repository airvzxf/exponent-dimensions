// Enlace hacia exponent-plot (https://exponent-plot.rovisoft.net), el
// visualizador hermano de exponentes positivos y negativos. Usa el mismo
// formato de hash que esta app: #b=<base>&e=<exponente>&lang=<es|en>.
// Allá la base va de 0 a 4 y el exponente de −4 a 4, así que la base de
// aquí (1–10) se recorta a 4; el exponente (0–3) cabe tal cual.

export const PLOT_URL = 'https://exponent-plot.rovisoft.net/';
export const PLOT_LIMITS = { baseMin: 0, baseMax: 4, exponentMin: -4, exponentMax: 4 };

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/**
 * @param {number} base     base de esta app (1–10)
 * @param {number} exponent exponente de esta app (0–3)
 * @param {string} lang     idioma actual ('es' | 'en')
 * @returns {{ url: string, base: number, exponent: number, clipped: boolean }}
 */
export function plotLink(base, exponent, lang) {
    const b = clamp(base, PLOT_LIMITS.baseMin, PLOT_LIMITS.baseMax);
    const e = clamp(exponent, PLOT_LIMITS.exponentMin, PLOT_LIMITS.exponentMax);
    const params = new URLSearchParams({ b, e, lang });
    return { url: `${PLOT_URL}#${params}`, base: b, exponent: e, clipped: b !== base || e !== exponent };
}

// 4, 3 → "4³" (también con signo: −2 → "⁻²")
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const power = (b, e) => `${b}${[...String(e)].map((c) => SUP[c]).join('')}`;
