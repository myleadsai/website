---
name: webgl-performance
description: Presupuesto de rendimiento, degradación por dispositivo, prevención de fugas de memoria y perfilado para sitios WebGL. Úsala cuando un sitio 3D va lento, al preparar la entrega, o al decidir qué se apaga en móvil y gama baja.
---

# Rendimiento WebGL

## Presupuesto

Fija estos números al arrancar, no al final:

| Métrica | Objetivo |
|---|---|
| Primer paint | < 2 MB transferidos |
| Interactivo completo | < 6 MB |
| Frame time (escritorio) | < 8 ms |
| Frame time (móvil gama media) | < 14 ms |
| Draw calls | < 100 |
| Contextos WebGL vivos | 1 |
| Memoria tras 5 navegaciones | sin crecimiento neto |

## Detección de capacidad

No detectes por user agent. Mide:

```js
function tier() {
  const gl = document.createElement('canvas').getContext('webgl2')
  if (!gl) return 'none'

  const cores  = navigator.hardwareConcurrency || 4
  const memory = navigator.deviceMemory || 4
  const coarse = matchMedia('(pointer: coarse)').matches
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE)

  if (cores <= 4 && memory <= 4) return 'low'
  if (coarse || maxTex < 8192)   return 'mid'
  return 'high'
}

const TIER = tier()

const CONFIG = {
  none: { webgl: false },
  low:  { webgl: true, detail: 16, dpr: 1,   post: false, particles: 0    },
  mid:  { webgl: true, detail: 32, dpr: 1.5, post: false, particles: 2000 },
  high: { webgl: true, detail: 64, dpr: 2,   post: true,  particles: 8000 },
}[TIER]
```

## Degradación automática en caliente

La detección estática falla: un portátil potente con batería baja hace throttling.
Mide y baja calidad en vivo:

```js
let frames = 0, acc = 0, degraded = false

function monitor(dt) {
  acc += dt; frames++
  if (frames < 60) return

  const avg = acc / frames
  frames = 0; acc = 0

  if (avg > 22 && !degraded) {       // ~45 fps sostenidos
    renderer.setPixelRatio(1)
    composer?.setSize(...)           // o desactiva post
    particles.visible = false
    degraded = true
    console.info('[perf] calidad reducida, frame medio:', avg.toFixed(1), 'ms')
  }
}
```

Degradar una vez y quedarse ahí. Un sistema que sube y baja calidad continuamente
produce parpadeo visible y es peor que quedarse en baja.

## Fugas de memoria

Three.js no tiene recolección de basura para recursos de GPU. Todo lo que creas, lo
liberas:

```js
function disposeAll(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose()
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.filter(Boolean).forEach((m) => {
      Object.values(m).forEach((v) => v?.isTexture && v.dispose())
      m.dispose()
    })
  })
  renderer.renderLists.dispose()
}
```

Al desmontar del todo: `renderer.dispose()` y `renderer.forceContextLoss()`. Sin el
segundo, el contexto sigue ocupando un slot del límite del navegador.

**Verificación:** DevTools → Memory → tomar heap snapshot, navegar 5 veces entre vistas,
tomar otro. Si el número de nodos GPU crece, tienes una fuga. No lo estimes, mídelo.

## Texturas

- Formatos comprimidos (KTX2 / Basis) antes que PNG. 4–6× menos memoria de GPU.
- Potencias de dos si necesitas mipmaps.
- `texture.minFilter = THREE.LinearFilter` + `generateMipmaps = false` para texturas
  que nunca se ven en escorzo: ahorra 33% de memoria.
- Una textura 4096² RGBA son 64 MB en GPU sin comprimir. Tres de esas y un móvil crashea.

## Reducir draw calls

```js
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
const merged = mergeGeometries(geometries)   // mismo material → 1 draw call
```

Para muchas copias del mismo objeto, `InstancedMesh`:

```js
const mesh = new THREE.InstancedMesh(geo, mat, 5000)   // 1 draw call, 5000 objetos
```

## Perfilado real

1. **spector.js** — inspeccionar frame a frame: draw calls, estado, shaders.
2. **DevTools → Performance**, con CPU throttling 4× para simular gama media.
3. **`renderer.info`** en consola: `{ render: { calls, triangles }, memory: {...} }`.
4. Dispositivo físico. El emulador de Chrome no simula el GPU ni el throttling térmico.

## Lista de verificación de entrega

- [ ] 60 fps en un móvil real de gama media
- [ ] `setPixelRatio` con tope 2
- [ ] Render pausado cuando el canvas sale de viewport
- [ ] Sin crecimiento de memoria tras navegar repetidamente
- [ ] Fallback sin WebGL probado (forzar `tier()` a `'none'`)
- [ ] `prefers-reduced-motion` probado
- [ ] Sitio navegable con el `<canvas>` borrado del DOM
- [ ] Lighthouse móvil: Performance ≥ 85
