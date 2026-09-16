---
name: page-transitions
description: Transiciones de página sin recarga — View Transitions API nativa y barba.js como respaldo, con preservación del contexto WebGL y transiciones de elemento compartido. Úsala al implementar navegación fluida entre vistas o al evitar que la escena 3D se reinicie al cambiar de página.
---

# Transiciones de página

## Primero la vía nativa

En 2026 la View Transitions API cubre la mayoría del caso sin librería, incluso para
navegación entre documentos:

```css
@view-transition { navigation: auto; }

::view-transition-old(root) { animation: fade-out .35s cubic-bezier(.4,0,1,1) both; }
::view-transition-new(root) { animation: fade-in  .45s cubic-bezier(0,0,.2,1) both; }

@keyframes fade-out { to   { opacity: 0 } }
@keyframes fade-in  { from { opacity: 0 } }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) { animation: none }
}
```

Dos líneas de CSS y las navegaciones multipágina ya son fluidas. Empieza aquí antes de
meter un router.

## Elemento compartido

Que la miniatura del proyecto crezca hasta ser el hero de su página de detalle:

```css
.work__poster        { view-transition-name: var(--vt-name); }
.detail__hero-image  { view-transition-name: var(--vt-name); }
```

```js
document.querySelectorAll('.work').forEach((card, i) => {
  card.style.setProperty('--vt-name', `work-${card.dataset.id}`)
})
```

El nombre debe ser **único en la página** y coincidir en ambas vistas. Dos elementos
con el mismo `view-transition-name` visibles a la vez cancelan la transición entera,
sin error en consola: es el fallo más difícil de diagnosticar de esta API.

## Fallback con barba.js

Si necesitas soportar navegadores sin View Transitions o quieres control fino:

```js
import barba from '@barba/core'

barba.init({
  preventRunning: true,
  transitions: [{
    name: 'default',
    async leave({ current }) {
      await gsap.to(current.container, { opacity: 0, duration: .4, ease: 'power2.in' })
    },
    async enter({ next }) {
      window.scrollTo(0, 0)
      await gsap.from(next.container, { opacity: 0, duration: .5, ease: 'power2.out' })
    },
  }],
})
```

## Lo que hay que rehacer en cada navegación

Esta es la parte que todo el mundo olvida y que convierte un sitio fluido en uno roto:

```js
barba.hooks.afterEnter(({ next }) => {
  ScrollTrigger.getAll().forEach((st) => st.kill())
  initReveals(next.container)
  ScrollTrigger.refresh()
  lenis.scrollTo(0, { immediate: true })
  gtag?.('event', 'page_view', { page_path: location.pathname })
})
```

Sin el `kill()`, los ScrollTriggers de la vista anterior siguen vivos apuntando a nodos
que ya no existen. El sitio se degrada con cada navegación hasta congelarse.

## Preservar la escena WebGL

El canvas debe vivir **fuera** del contenedor que se reemplaza:

```html
<body>
  <canvas id="bg-canvas"></canvas>        <!-- persiste -->
  <main data-barba="wrapper">
    <div data-barba="container">...</div> <!-- se reemplaza -->
  </main>
</body>
```

Así la escena nunca se reinicializa: solo transicionas sus uniforms entre vistas.

```js
barba.hooks.beforeEnter(({ next }) => {
  const theme = next.container.dataset.sceneTheme   // 'works' | 'about'
  gsap.to(material.uniforms.uColorA.value, { ...THEMES[theme].a, duration: .8 })
})
```

Reinicializar WebGL en cada navegación cuesta 200–400 ms y arriesga fugas de contexto.
Los navegadores limitan los contextos WebGL simultáneos (~16); llegar al tope hace que
el canvas quede en negro sin recuperación.

## Prefetch al hover

```js
document.querySelectorAll('a[href^="/"]').forEach((a) => {
  a.addEventListener('pointerenter', () => {
    if (a.dataset.prefetched) return
    const link = Object.assign(document.createElement('link'),
      { rel: 'prefetch', href: a.href })
    document.head.appendChild(link)
    a.dataset.prefetched = '1'
  }, { once: true, passive: true })
})
```

Da ~200 ms de ventaja gratis: el tiempo entre que el cursor entra al enlace y el clic.
