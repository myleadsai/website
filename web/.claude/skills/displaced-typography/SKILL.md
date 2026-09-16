---
name: displaced-typography
description: Tipografía de display con distorsión, refracción y aberración cromática — títulos que se deforman con el cursor o el scroll. Úsala al crear titulares tipo "ALCHE"/"WORKS" con efecto líquido o cristal, con texto en canvas o SVG sobre WebGL.
---

# Tipografía desplazada

## Decisión previa: ¿cuánto texto?

- **Una o dos palabras de display** → texto en WebGL, vale la pena.
- **Un párrafo** → DOM con filtros CSS/SVG. Meter texto largo en WebGL destruye la
  accesibilidad y el SEO por un efecto que nadie va a leer.

Siempre, sin excepción, el texto real existe en el DOM:

```html
<h1 class="hero__title">
  <span class="sr-only">ALCHE</span>
  <canvas data-text="ALCHE" aria-hidden="true"></canvas>
</h1>
```

## Texto como textura

La vía más simple y la que mejor rinde: renderiza el texto a un canvas 2D, úsalo como
textura, deforma la textura en el shader.

```js
function makeTextTexture(text, { size = 220, font = 'Poppins' } = {}) {
  const c = document.createElement('canvas')
  const dpr = Math.min(devicePixelRatio, 2)
  const ctx = c.getContext('2d')

  ctx.font = `700 ${size}px ${font}`
  const m = ctx.measureText(text)

  c.width  = Math.ceil((m.width + size * 0.4) * dpr)
  c.height = Math.ceil(size * 1.4 * dpr)
  ctx.scale(dpr, dpr)

  ctx.font = `700 ${size}px ${font}`       // reasignar: el resize limpia el contexto
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, size * 0.2, (size * 1.4) / 2)

  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter       // sin mipmaps: el texto se ve más nítido
  tex.generateMipmaps = false
  return tex
}
```

Reasignar `ctx.font` después de cambiar `width`/`height` es obligatorio: redimensionar
un canvas resetea todo su estado y es el bug más común de esta técnica.

## Shader: desplazamiento + aberración cromática

```glsl
uniform sampler2D uText;
uniform float uTime;
uniform vec2  uMouse;
uniform float uStrength;
varying vec2  vUv;

void main() {
  vec2 uv = vUv;

  float dist  = distance(uv, uMouse);
  float ripple = sin(dist * 22.0 - uTime * 2.4) * exp(-dist * 5.0);
  vec2 offset = normalize(uv - uMouse + 1e-5) * ripple * uStrength;

  // separar canales = aberración cromática
  float r = texture2D(uText, uv + offset * 1.25).a;
  float g = texture2D(uText, uv + offset * 1.00).a;
  float b = texture2D(uText, uv + offset * 0.75).a;

  float a = max(r, max(g, b));
  gl_FragColor = vec4(r, g, b, a);
}
```

El canal alfa se lee de la textura de texto; los tres desplazamientos distintos por canal
producen el borde iridiscente. Sin `max()` en el alfa aparecen halos recortados.

## Variante sin WebGL: filtro SVG

Para un efecto más suave y con cero coste de canvas:

```html
<svg width="0" height="0">
  <filter id="liquid">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03"
                  numOctaves="2" seed="7" result="noise">
      <animate attributeName="baseFrequency" dur="14s"
               values="0.012 0.03; 0.018 0.02; 0.012 0.03" repeatCount="indefinite"/>
    </feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="14"
                       xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```

```css
.hero__title { filter: url(#liquid); }
@media (prefers-reduced-motion: reduce) { .hero__title { filter: none; } }
```

`feDisplacementMap` es costoso en Safari sobre áreas grandes. Aplícalo a un titular,
no a una sección entera.

## Carga de fuentes

Genera la textura después de que la fuente esté lista, o renderizarás en la fuente de
respaldo y el efecto quedará con la métrica equivocada:

```js
await document.fonts.load('700 220px Poppins')
await document.fonts.ready
const texture = makeTextTexture('ALCHE')
```
