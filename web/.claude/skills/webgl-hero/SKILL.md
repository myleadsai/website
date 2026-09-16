---
name: webgl-hero
description: Construir un hero WebGL con Three.js y shaders personalizados (esfera distorsionada, fondo de ruido, malla reactiva al cursor). Úsala al crear la escena principal de un sitio inmersivo, al escribir vertex/fragment shaders, o al montar el canvas de fondo de una landing.
---

# Hero WebGL

## Montaje base

Renderer con los ajustes que importan, no los que vienen por defecto:

```js
import * as THREE from 'three'

const canvas = document.querySelector('#hero-canvas')
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,        // usa FXAA en post si lo necesitas: MSAA es caro
  alpha: true,
  powerPreference: 'high-performance',
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))  // nunca 3
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
camera.position.z = 3
```

`setPixelRatio` sin tope es la causa número uno de heroes que van a 20 fps en pantallas
Retina. Tope 2, siempre.

## Esfera distorsionada por ruido

El efecto del hero de alche.jp: una esfera cuya superficie se desplaza con ruido simplex
y refracta el fondo.

```glsl
// vertex
uniform float uTime;
uniform float uAmplitude;
uniform vec2  uMouse;
varying vec3  vNormal;
varying vec3  vPosition;

// simplex noise 3D: pega aquí una implementación (Ashima / stegu)
float snoise(vec3 v);

void main() {
  vNormal = normalize(normalMatrix * normal);

  float n = snoise(position * 1.8 + vec3(0.0, 0.0, uTime * 0.25));
  float pull = smoothstep(0.6, 0.0, distance(normal.xy, uMouse));
  vec3 displaced = position + normal * (n * uAmplitude + pull * 0.15);

  vPosition = displaced;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
```

```glsl
// fragment
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 3.0);
  vec3 color = mix(uColorA, uColorB, fresnel);
  gl_FragColor = vec4(color, fresnel * 0.9 + 0.1);
}
```

El término **fresnel** es lo que da el borde luminoso característico. Sin él la esfera
se ve plana y muerta.

## Segmentación de la geometría

`new THREE.IcosahedronGeometry(1, 64)` son ~80k triángulos. En móvil eso duele.
Escala la subdivisión al dispositivo:

```js
const detail = window.innerWidth < 768 ? 24 : 64
const geometry = new THREE.IcosahedronGeometry(1, detail)
```

Icosaedro, no esfera UV: la distribución de vértices es uniforme, así que el ruido no
se acumula en los polos.

## Seguimiento de cursor con inercia

El cursor crudo se siente barato. Interpola siempre:

```js
const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

window.addEventListener('pointermove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth)  * 2 - 1
  mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1
}, { passive: true })

function tick(t) {
  mouse.x += (mouse.tx - mouse.x) * 0.06   // 0.06 ≈ pesado y caro
  mouse.y += (mouse.ty - mouse.y) * 0.06
  material.uniforms.uMouse.value.set(mouse.x, mouse.y)
  material.uniforms.uTime.value = t * 0.001
  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
```

Factor de interpolación: 0.03–0.05 se siente lujoso y lento, 0.1–0.15 se siente ágil,
por encima de 0.3 ya no se nota la inercia.

## Resize sin thrashing

```js
const ro = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
})
ro.observe(canvas)
```

`ResizeObserver` sobre el canvas, no `window.resize`: no se dispara con la barra de
direcciones de Safari móvil apareciendo y desapareciendo.

## Pausar fuera de pantalla

Un hero que sigue renderizando cuando ya no se ve quema batería sin dar nada:

```js
let running = true
new IntersectionObserver(([e]) => { running = e.isIntersecting }).observe(canvas)
// dentro de tick(): if (!running) { requestAnimationFrame(tick); return }
```

## Errores que cuestan caro

- Crear materiales o geometrías dentro del loop de render. Créalos una vez.
- No llamar `.dispose()` en geometrías, materiales y texturas al desmontar: fuga segura.
- Usar `OrbitControls` en un hero de marketing. Nadie quiere orbitar tu logo.
- Poner el texto del titular dentro del canvas. Va en el DOM, encima del canvas.
