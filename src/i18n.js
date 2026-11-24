// Textos de la interfaz en español e inglés.
// Las cadenas con HTML (appsBody) son contenido propio y estático, nunca entrada del usuario.

const es = {
    pageTitle: 'Visualizador de Potencias en Dimensiones · 0D, 1D, 2D y 3D',
    title: 'Visualizador de Potencias en Dimensiones',
    langGroup: 'Idioma',
    dimLabel: 'Dimensión (Exponente)',
    dimNames: ['Punto', 'Línea', 'Cuadrado', 'Cubo'],
    baseLabel: 'Tamaño (Base)',
    sliceLabel: 'Corte (como en una tomografía)',
    sliceAll: 'Todos',
    viewLabel: 'Vista',
    showLabels: 'Mostrar etiquetas',
    build: '▶ Construir paso a paso',
    resetCamera: '⟲ Restablecer cámara',
    powerLabel: 'Potencia directa',
    rootLabel: 'Operación inversa (raíz)',
    scrollTop: 'Volver a controles',
    retry: 'Reintentar',
    error3d: 'No se pudo cargar el motor 3D. Revisa tu conexión o que tu navegador tenga WebGL activado.',
    footerLicense: 'Distribuido bajo licencia',
    footerSource: 'Ver',
    footerSourceLink: 'código fuente',
    unitLabel: '1 u',
    plotLink: 'Ver exponentes negativos y la cancelación nᵏ · n⁻ᵏ = 1 →',
    plotNote: (p) => `Abre ${p} en el visualizador de exponentes positivos y negativos.`,
    plotClipped: (p) => `Se muestra ${p}: allá la base llega hasta 4.`,

    steps(B, E, result) {
        if (E === 0) return 'Producto vacío: sin multiplicar nada queda 1 (el elemento neutro).';
        return `Operación: ${Array(E).fill(B).join(' × ')} = ${result}`;
    },
    rootUndefined: 'no está definida',

    describe(B, E, result, slice) {
        switch (E) {
            case 0:
                return 'Visualización en 0D: un único punto. Cualquier base elevada a 0 da 1: un punto no tiene largo, ancho ni alto, así que el tamaño de la base no importa. Por eso la raíz de índice 0 no existe: desde el 1 no se puede saber de qué base se partió.';
            case 1:
                return `Visualización en 1D: el punto repetido ${B} veces en una dirección forma una línea de ${B} unidades. La raíz de índice 1 devuelve la misma base (${B}).`;
            case 2:
                return `Visualización en 2D: la línea de ${B} unidades copiada ${B} veces hacia arriba forma una cuadrícula de ${B} × ${B} = ${result} cuadrados unitarios, identificados por sus coordenadas (x, y). La raíz cuadrada devuelve el lado (${B}).`;
            default: {
                const base = `Visualización en 3D: el cuadrado de ${B} × ${B} apilado ${B} veces en profundidad forma un cubo de ${result} cubos unitarios. La raíz cúbica devuelve el lado (${B}).`;
                if (!slice) return base;
                return `${base} Corte ${slice} de ${B}: una sola capa es un cuadrado de ${B} × ${B} = ${B * B} cubos. Así se reduce el cubo a 2D, igual que una tomografía muestra el cuerpo corte a corte.`;
            }
        }
    },

    appsTitle: '¿Para qué sirve? Crear y reducir dimensiones',
    appsBody: `
        <p>Multiplicar por la base <strong>añade una dimensión</strong>: copias la figura anterior <em>B</em> veces en una dirección nueva (punto → línea → cuadrado → cubo). La raíz hace el camino inverso: a partir del total (área, volumen, píxeles, vóxeles) recupera <strong>cuánto mide un lado</strong>. Y cortar una figura en rebanadas <strong>reduce</strong> su dimensión en uno.</p>
        <ul>
            <li><strong>Tomografía (TC) y resonancia magnética.</strong> El equipo reconstruye el cuerpo como una pila de cortes 2D. Con cortes de 512 × 512 = 512² ≈ 262 mil píxeles, 512 cortes forman un volumen de 512³ ≈ 134 millones de vóxeles. El médico hace lo inverso: recorre ese volumen 3D mirándolo en planos 2D. Prueba el control <em>Corte</em> en la vista 3D.</li>
            <li><strong>Impresión 3D.</strong> El programa laminador (<em>slicer</em>) rebana el modelo 3D en capas 2D y la impresora las apila una sobre otra hasta reconstruir el objeto.</li>
            <li><strong>Pantallas y fotos.</strong> Una imagen de 1000 × 1000 tiene 1000² = 1 000 000 píxeles, y √1 000 000 = 1000 píxeles por lado. Duplicar el lado cuadruplica los píxeles: 4K (3840 × 2160) tiene 2² = 4 veces los píxeles de Full HD (1920 × 1080).</li>
            <li><strong>Volumen y capacidad.</strong> 1 litro = 1000 cm³ = 10³: cabe en un cubo de ∛1000 = 10 cm de lado.</li>
            <li><strong>Ley del cuadrado-cubo.</strong> Si un animal duplica su tamaño, su superficie crece 2² = 4 veces y su peso 2³ = 8 veces. Por eso los elefantes necesitan patas gruesas y el hielo picado se derrite antes que un cubo grande.</li>
        </ul>`,
};

const en = {
    pageTitle: 'Powers in Dimensions Visualizer · 0D, 1D, 2D and 3D',
    title: 'Powers in Dimensions Visualizer',
    langGroup: 'Language',
    dimLabel: 'Dimension (Exponent)',
    dimNames: ['Point', 'Line', 'Square', 'Cube'],
    baseLabel: 'Size (Base)',
    sliceLabel: 'Slice (like a CT scan)',
    sliceAll: 'All',
    viewLabel: 'View',
    showLabels: 'Show labels',
    build: '▶ Build step by step',
    resetCamera: '⟲ Reset camera',
    powerLabel: 'Power',
    rootLabel: 'Inverse operation (root)',
    scrollTop: 'Back to controls',
    retry: 'Retry',
    error3d: 'The 3D engine could not be loaded. Check your connection and that WebGL is enabled in your browser.',
    footerLicense: 'Released under the',
    footerSource: 'View the',
    footerSourceLink: 'source code',
    unitLabel: '1 u',
    plotLink: 'See negative exponents and the cancellation nᵏ · n⁻ᵏ = 1 →',
    plotNote: (p) => `Opens ${p} in the positive and negative exponents visualizer.`,
    plotClipped: (p) => `Shows ${p}: the base there only goes up to 4.`,

    steps(B, E, result) {
        if (E === 0) return 'Empty product: multiplying nothing leaves 1 (the identity element).';
        return `Operation: ${Array(E).fill(B).join(' × ')} = ${result}`;
    },
    rootUndefined: 'is undefined',

    describe(B, E, result, slice) {
        switch (E) {
            case 0:
                return '0D view: a single point. Any base raised to 0 is 1: a point has no length, width or height, so the base does not matter. That is why the 0th root does not exist: from 1 alone you cannot tell which base you started with.';
            case 1:
                return `1D view: the point repeated ${B} times in one direction makes a line of ${B} units. The 1st root gives back the same base (${B}).`;
            case 2:
                return `2D view: the line of ${B} units copied ${B} times upwards makes a ${B} × ${B} = ${result} grid of unit squares, labelled by their (x, y) coordinates. The square root gives back the side (${B}).`;
            default: {
                const base = `3D view: the ${B} × ${B} square stacked ${B} times in depth makes a cube of ${result} unit cubes. The cube root gives back the side (${B}).`;
                if (!slice) return base;
                return `${base} Slice ${slice} of ${B}: a single layer is a ${B} × ${B} = ${B * B} square of cubes. This reduces the cube to 2D, just as a CT scan shows the body slice by slice.`;
            }
        }
    },

    appsTitle: 'What is it for? Creating and reducing dimensions',
    appsBody: `
        <p>Multiplying by the base <strong>adds a dimension</strong>: you copy the previous shape <em>B</em> times in a new direction (point → line → square → cube). The root goes the other way: from the total (area, volume, pixels, voxels) it recovers <strong>how long one side is</strong>. And cutting a shape into slices <strong>reduces</strong> its dimension by one.</p>
        <ul>
            <li><strong>CT and MRI scans.</strong> The scanner reconstructs the body as a stack of 2D slices. With 512 × 512 = 512² ≈ 262 thousand pixels per slice, 512 slices make a volume of 512³ ≈ 134 million voxels. Doctors do the reverse: they browse that 3D volume as 2D planes. Try the <em>Slice</em> control in the 3D view.</li>
            <li><strong>3D printing.</strong> The slicer software cuts the 3D model into 2D layers, and the printer stacks them one on top of another to rebuild the object.</li>
            <li><strong>Screens and photos.</strong> A 1000 × 1000 image has 1000² = 1,000,000 pixels, and √1,000,000 = 1000 pixels per side. Doubling the side quadruples the pixels: 4K (3840 × 2160) has 2² = 4 times the pixels of Full HD (1920 × 1080).</li>
            <li><strong>Volume and capacity.</strong> 1 litre = 1000 cm³ = 10³: it fits in a cube with a side of ∛1000 = 10 cm.</li>
            <li><strong>Square-cube law.</strong> If an animal doubles in size, its surface grows 2² = 4 times and its weight 2³ = 8 times. That is why elephants need thick legs and crushed ice melts faster than one big cube.</li>
        </ul>`,
};

export const STRINGS = { es, en };
export const LANGS = Object.keys(STRINGS);
