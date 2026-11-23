# Changelog

Todos los cambios importantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

Primera versión numerada. Hasta ahora el sitio se publicaba sin versiones.

### Añadido

- **Dimensión 0D (punto):** `B⁰ = 1` sin importar la base, con la
  explicación de por qué la raíz de índice 0 no está definida.
- **Construir paso a paso:** una animación muestra que cada dimensión es
  la anterior copiada *B* veces (el punto forma la línea, la línea apilada
  forma el cuadrado y el cuadrado apilado forma el cubo). Se reproduce al
  cambiar de dimensión y con su botón.
- **Corte (como en una tomografía):** en 3D muestra una sola capa del
  cubo y deja las demás como contorno, para ver cómo un volumen se reduce
  a un cuadrado 2D.
- **¿Para qué sirve?:** sección con ejemplos reales de crear y reducir
  dimensiones: tomografía y resonancia, impresión 3D, píxeles de pantallas,
  litros y cm³, y la ley del cuadrado-cubo.
- **Enlaces compartibles:** la base, la dimensión y el idioma se guardan
  en la URL (`#b=4&e=3&lang=es`).
- **Inglés:** la interfaz completa en español e inglés, con detección del
  idioma del navegador.
- **Opciones de vista:** mostrar u ocultar etiquetas y restablecer la
  cámara 3D.
- Imagen de vista previa para redes sociales (1200×630) e icono para iOS.

### Cambiado

- **Three.js r128 → 0.187** como módulo ES con hashes de integridad (SRI).
  Solo se descarga al abrir la vista 3D; si el CDN falla aparece un aviso
  con botón para reintentar.
- **Vista 3D más ligera:** el cubo se dibuja con `InstancedMesh` (2
  llamadas de dibujo para hasta 1000 cubos) en lugar de 2000 objetos.
- **Selector de dimensión accesible:** radios nativos que funcionan con
  las flechas del teclado, foco visible, descripciones para lectores de
  pantalla y respeto a `prefers-reduced-motion`.
- **Favicon dibujado con trazos** y la paleta de la app, igual en cualquier
  sistema operativo.
- El código se separa en `index.html`, `styles.css`, `app.js`,
  `scene3d.js` e `i18n.js`.

### Corregido

- La vista 3D ya no acumula memoria de GPU al mover el slider de la base.
- Redimensionar la ventana ya no reinicia la cámara 3D.
- El bucle de render 3D se detiene al salir de la vista 3D.
- El canvas 2D se ve nítido en pantallas de alta densidad y se redibuja
  cuando carga la fuente.
- Las etiquetas de la línea y de la cuadrícula ya no se solapan en
  pantallas estrechas.
- Las caras transparentes del cubo ya no ocultan los cubos de detrás.
- El texto inicial de la página coincide con lo que dibuja la app.
- Las etiquetas del formulario apuntan a su control.

[Unreleased]: https://github.com/airvzxf/exponent-dimensions/commits/main
