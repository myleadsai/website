---
name: scroll-choreography
description: Scroll suave con Lenis y animaciones dirigidas por scroll con GSAP ScrollTrigger — pinning, scrub, reveals escalonados y sincronización con una escena WebGL. Úsala al implementar scroll narrativo, secciones fijadas, o al conectar el progreso de scroll con uniforms de shader.
---

# Coreografía de scroll

## Lenis + GSAP: un solo reloj

El error clásico es dejar que Lenis y GSAP corran cada uno con su propio RAF. Se
desincronizan y aparece jitter. Un solo loop:

```js
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const lenis = new Lenis({
  duration: 1.1,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  syncTouch: false,   // en táctil deja el scroll nativo: se siente mejor
})

lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

`syncTouch: false` es deliberado. El scroll suave forzado en móvil pelea con el
momentum del sistema y se siente roto.

## Sección fijada con scrub

```js
gsap.timeline({
  scrollTrigger: {
    trigger: '.works',
    start: 'top top',
    end: '+=300%',      // 3 alturas de viewport de recorrido
    pin: true,
    scrub: 1,           // 1s de suavizado; true = pegado exacto al scroll
    anticipatePin: 1,
  },
})
.to('.works__panel', { xPercent: -200, ease: 'none' })
.to('.works__title', { opacity: 0, duration: 0.2 }, 0)
```

`scrub: 1` en lugar de `scrub: true` es lo que separa un scroll que se siente caro de
uno que se siente crudo. `anticipatePin: 1` elimina el salto de un frame al fijar.

## Reveals escalonados

```js
gsap.utils.toArray('.reveal').forEach((el) => {
  gsap.from(el.children, {
    yPercent: 120,
    opacity: 0,
    duration: 1,
    stagger: 0.08,
    ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 80%', once: true },
  })
})
```

`once: true` importa: sin eso los elementos re-animan al hacer scroll hacia arriba y
se siente nervioso. `expo.out` es la curva que da la sensación de "entra rápido, asienta
suave" típica de estos sitios.

## Conectar el scroll a un shader

El puente entre esta skill y `webgl-hero`:

```js
ScrollTrigger.create({
  trigger: '.hero',
  start: 'top top',
  end: 'bottom top',
  onUpdate: (self) => {
    material.uniforms.uScrollProgress.value = self.progress   // 0 → 1
    material.uniforms.uVelocity.value = self.getVelocity() / 2000
  },
})
```

`getVelocity()` dividido es oro: alimenta distorsión proporcional a la velocidad del
scroll. Clamp el valor o los golpes de trackpad producen artefactos violentos:

```js
const v = gsap.utils.clamp(-1, 1, self.getVelocity() / 2000)
```

## Refresco tras cargar imágenes

ScrollTrigger calcula posiciones al crearse. Si las imágenes cargan después, todos los
disparadores quedan corridos:

```js
window.addEventListener('load', () => ScrollTrigger.refresh())
document.fonts.ready.then(() => ScrollTrigger.refresh())
```

Las fuentes son la causa más olvidada: cambian la altura del texto al cargar.

## Movimiento reducido

No es opcional, y no basta con bajar duraciones:

```js
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  lenis.destroy()
  ScrollTrigger.getAll().forEach((st) => st.kill())
  gsap.set('.reveal > *', { clearProps: 'all', opacity: 1, yPercent: 0 })
}
```

El contenido debe quedar visible y el scroll nativo. Un usuario con movimiento reducido
que ve una página en blanco porque los reveals nunca se dispararon es un fallo grave.

## Limpieza en navegación SPA

```js
ScrollTrigger.getAll().forEach((st) => st.kill())
```

Sin esto, cada navegación acumula disparadores muertos y el sitio se degrada con el uso.
