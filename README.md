# Exponent Dimensions

Visualizador geométrico interactivo de potencias y raíces. Explora conceptos matemáticos representados en 1D (línea), 2D (cuadrado) y 3D (cubo) con colores HSL dinámicos.

**Demo:** [exponent-dimensions.rovisoft.net](https://exponent-dimensions.rovisoft.net/)

## Descripción

Exponent Dimensions es una aplicación web educativa que permite visualizar de forma interactiva cómo funcionan las potencias y sus operaciones inversas (raíces) a través de representaciones geométricas en distintas dimensiones. Cada unidad se colorea de forma única usando un algoritmo HSL dinámico, facilitando la comprensión visual de la composición de cada potencia.

## Funcionalidades

- **1D (Línea):** Visualiza una base como segmentos unitarios de colores sobre una recta numérica con marcadores enteros.
- **2D (Cuadrado):** Muestra una cuadrícula de base × base con celdas multicolores, ejes coordenados y etiquetas.
- **3D (Cubo):** Renderiza un arreglo de base × base × base cubos unitarios semi-transparentes con bordes de colores, usando Three.js y OrbitControls para rotación interactiva.
- **Panel matemático en tiempo real:** Muestra la expresión de potencia, el desglose paso a paso de la multiplicación, y la operación inversa (raíz) con notación de exponente fraccionario.
- **Controles interactivos:** Slider para la base (1–10) y botones segmentados para seleccionar la dimensión/exponente.
- **Diseño responsivo:** Se adapta a dispositivos móviles y pantallas cortas con layout vertical y botón flotante de scroll.
- **Colores dinámicos:** Algoritmo de coloración HSL que genera colores únicos y secuenciales para cada unidad, evitando repeticiones visuales entre ciclos.

## Estructura del Proyecto

```
exponent-dimensions/
├── LICENSE              # GNU AGPL v3
├── README.md
└── src/
    ├── favicon.png      # Favicon PNG (512×512)
    ├── favicon.svg      # Favicon SVG
    └── index.html       # Aplicación completa (HTML + CSS + JS)
```

La aplicación es un archivo único (`src/index.html`) que contiene todo el HTML, CSS y JavaScript sin dependencias locales — carga Three.js y OrbitControls desde CDN.

## Uso

Abre `src/index.html` directamente en un navegador, o sirve el directorio `src/` con cualquier servidor HTTP estático:

```bash
# Con Python
python3 -m http.server 8000 --directory src

# Con Node.js (npx)
npx serve src
```

Luego visita `http://localhost:8000` (o el puerto indicado).

## Tecnologías

- **HTML5 Canvas 2D** — Renderizado de visualizaciones 1D y 2D
- **Three.js r128** — Renderizado 3D con WebGL
- **OrbitControls** — Rotación e interacción con la escena 3D
- **Google Fonts** — Fira Code y Plus Jakarta Sans
- **CSS Custom Properties** — Tema oscuro con acentos esmeralda/cyan

## Licencia

Copyright (C) 2026 Israel Alberto Roldan Vega. Este proyecto está licenciado bajo la [GNU Affero General Public License v3.0](LICENSE).
