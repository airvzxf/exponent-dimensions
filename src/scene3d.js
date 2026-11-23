// Escena 3D del cubo de cubos. Este módulo se importa de forma diferida, solo cuando
// el usuario abre la vista 3D, para no descargar Three.js si no hace falta.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CUBE_UNIT_SIZE = 1.2;
const CUBE_GAP = 0.08;
const FILL_OPACITY = 0.35;
const EDGE_OPACITY = 0.8;
// Brillo de los bordes de las capas no seleccionadas en el modo corte (quedan como contorno tenue)
const DIMMED = 0.22;
const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);

export function createScene3D(container, { getUnitColor, reducedMotion }) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

    // Lanza una excepción si el navegador no soporta WebGL; quien llama la captura
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !reducedMotion;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2; // La cámara no baja del plano del suelo
    controls.minDistance = 3;
    controls.maxDistance = 50;

    // Desde r155 las luces usan unidades físicas; multiplicar por π conserva el brillo original
    scene.add(new THREE.AmbientLight(0xffffff, 0.55 * Math.PI));
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.65 * Math.PI);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.35 * Math.PI);
    dirLight2.position.set(-10, 8, -10);
    scene.add(dirLight2);

    // Rejilla de referencia en el piso: líneas centrales gris claro y resto gris medio
    scene.add(new THREE.GridHelper(30, 30, 0xaaaaaa, 0x606060));

    // Geometrías y materiales compartidos: se crean una sola vez y se reutilizan
    const size = CUBE_UNIT_SIZE - CUBE_GAP;
    const boxGeometry = new THREE.BoxGeometry(size, size, size);
    const edgeTemplate = new THREE.EdgesGeometry(boxGeometry).getAttribute('position').array;
    const VERTS_PER_CUBE = edgeTemplate.length / 3;

    const fillMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff, // el color real viene de cada instancia
        transparent: true,
        opacity: FILL_OPACITY,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false, // evita que las caras transparentes oculten los cubos de atrás
    });
    const edgeMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: EDGE_OPACITY,
        depthWrite: false,
    });

    let base = 0;
    let fills = null;     // THREE.InstancedMesh con todos los cubos
    let edges = null;     // THREE.LineSegments con los bordes de todos los cubos
    let baseColors = [];  // color original de cada unidad
    let matrices = [];    // posición de cada unidad
    let visibleSlices = 0;
    let slice = 0;        // 0 = todas las capas; k = solo la capa k (1..B)

    function disposeCubes() {
        if (fills) {
            scene.remove(fills);
            fills.dispose();
            fills = null;
        }
        if (edges) {
            scene.remove(edges);
            edges.geometry.dispose();
            edges = null;
        }
    }

    // Construye B³ cubos en dos objetos (2 llamadas de dibujo en total).
    // El orden es z → y → x, el mismo índice que usan las vistas 1D y 2D, así que
    // la primera capa del cubo (z = 0) es exactamente la cuadrícula 2D.
    function setBase(B) {
        disposeCubes();
        base = B;
        const count = B * B * B;
        const S = CUBE_UNIT_SIZE;

        fills = new THREE.InstancedMesh(boxGeometry, fillMaterial, count);
        const edgePositions = new Float32Array(count * edgeTemplate.length);
        const edgeColors = new Float32Array(count * edgeTemplate.length);
        baseColors = new Array(count);
        matrices = new Array(count);

        for (let z = 0; z < B; z++) {
            for (let y = 0; y < B; y++) {
                for (let x = 0; x < B; x++) {
                    const index = z * B * B + y * B + x;
                    // Centrado en XZ y apoyado en el suelo (Y = 0)
                    const px = (x - (B - 1) / 2) * S;
                    const py = (y + 0.5) * S;
                    const pz = (z - (B - 1) / 2) * S;

                    matrices[index] = new THREE.Matrix4().makeTranslation(px, py, pz);

                    const c = getUnitColor(index);
                    const color = new THREE.Color().setHSL(c.hue / 360, c.saturation / 100, c.lightness / 100);
                    baseColors[index] = color;

                    const offset = index * edgeTemplate.length;
                    for (let i = 0; i < edgeTemplate.length; i += 3) {
                        edgePositions[offset + i] = edgeTemplate[i] + px;
                        edgePositions[offset + i + 1] = edgeTemplate[i + 1] + py;
                        edgePositions[offset + i + 2] = edgeTemplate[i + 2] + pz;
                    }
                }
            }
        }

        const edgeGeometry = new THREE.BufferGeometry();
        edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
        edgeGeometry.setAttribute('color', new THREE.BufferAttribute(edgeColors, 3));
        edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);

        scene.add(fills);
        scene.add(edges);

        slice = Math.min(slice, B);
        visibleSlices = B;
        applyColors();
        applyVisibility();
        resetCamera();
    }

    // En modo corte, las capas no seleccionadas pierden el relleno (escala 0)
    // y conservan solo un contorno tenue; la capa elegida se ve completa.
    function applyColors() {
        if (!fills) return;
        const B = base;
        const edgeColors = edges.geometry.getAttribute('color');
        const tmp = new THREE.Color();
        for (let index = 0; index < baseColors.length; index++) {
            const z = Math.floor(index / (B * B));
            const dimmed = slice > 0 && z !== slice - 1;
            fills.setMatrixAt(index, dimmed ? HIDDEN : matrices[index]);
            fills.setColorAt(index, baseColors[index]);
            tmp.copy(baseColors[index]);
            if (dimmed) tmp.multiplyScalar(DIMMED);
            const offset = index * VERTS_PER_CUBE;
            for (let v = 0; v < VERTS_PER_CUBE; v++) {
                edgeColors.setXYZ(offset + v, tmp.r, tmp.g, tmp.b);
            }
        }
        fills.instanceMatrix.needsUpdate = true;
        fills.instanceColor.needsUpdate = true;
        fills.computeBoundingSphere();
        edgeColors.needsUpdate = true;
    }

    // Muestra solo las primeras `visibleSlices` capas en profundidad (animación de construcción)
    function applyVisibility() {
        if (!fills) return;
        const cubes = visibleSlices * base * base;
        fills.count = cubes;
        edges.geometry.setDrawRange(0, cubes * VERTS_PER_CUBE);
    }

    function setProgress(progress) {
        // Se parte de una capa (el cuadrado 2D) y se apilan las demás
        const next = Math.max(1, Math.min(base, Math.ceil(progress * base)));
        if (next !== visibleSlices) {
            visibleSlices = next;
            applyVisibility();
        }
    }

    function setSlice(k) {
        if (k === slice) return;
        slice = k;
        applyColors();
    }

    function resetCamera() {
        const distance = Math.max(base * CUBE_UNIT_SIZE * 2.1, 7.5);
        camera.position.set(distance * 0.9, distance * 0.8, distance * 1.15);
        controls.target.set(0, (base * CUBE_UNIT_SIZE) / 2, 0);
        controls.update();
    }

    function resize() {
        const W = container.clientWidth;
        const H = container.clientHeight;
        if (!W || !H) return;
        renderer.setSize(W, H);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
    }

    // El bucle de render solo corre mientras la vista 3D está visible
    function start() {
        resize();
        renderer.setAnimationLoop(() => {
            controls.update();
            renderer.render(scene, camera);
        });
    }

    function stop() {
        renderer.setAnimationLoop(null);
    }

    return { setBase, setProgress, setSlice, resetCamera, resize, start, stop };
}
