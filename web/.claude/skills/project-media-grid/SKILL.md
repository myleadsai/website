---
name: project-media-grid
description: Grilla de proyectos con video en hover, carga perezosa, filtros por categoría y metadatos — el patrón de portafolio de estudio creativo. Úsala al construir una sección "Works"/"Proyectos" con tarjetas de video, filtrado por tags o galerías de casos.
---

# Grilla de proyectos con media

## Estructura

Semántica primero; el efecto viene después:

```html
<ul class="works" role="list">
  <li class="work" data-tags="fortnite metaverse 3dcg">
    <a class="work__link" href="/works/kizuna-ai">
      <figure class="work__media">
        <img class="work__poster" src="/img/kizuna.webp" alt="" loading="lazy"
             width="1280" height="720" decoding="async">
        <video class="work__video" muted loop playsinline preload="none"
               poster="/img/kizuna.webp" aria-hidden="true"
               data-src="/video/kizuna.mp4"></video>
      </figure>
      <h3 class="work__title">KizunaAI "Hello, Fortnite"</h3>
      <p class="work__meta"><time datetime="2024-05-20">2024.05.20</time></p>
      <ul class="work__tags" role="list">
        <li>fortnite</li><li>metaverse</li><li>3DCG</li>
      </ul>
    </a>
  </li>
</ul>
```

`width`/`height` en el `img` evitan layout shift. `alt=""` porque el título adyacente
ya describe el proyecto — un alt duplicado es ruido para lectores de pantalla.

## Video solo cuando hace falta

Nunca `preload="auto"` en una grilla. Diez videos precargando son 40 MB antes de que
el usuario mueva el ratón. Carga la fuente en el primer hover:

```js
const cards = document.querySelectorAll('.work')

cards.forEach((card) => {
  const video = card.querySelector('.work__video')
  let loaded = false

  const play = () => {
    if (!loaded) {
      video.src = video.dataset.src
      loaded = true
    }
    video.play().catch(() => {})   // autoplay bloqueado: silencioso, no rompe nada
    card.classList.add('is-playing')
  }

  const stop = () => {
    video.pause()
    card.classList.remove('is-playing')
  }

  card.addEventListener('pointerenter', play)
  card.addEventListener('pointerleave', stop)
  card.querySelector('a').addEventListener('focus', play)   // paridad con teclado
  card.querySelector('a').addEventListener('blur', stop)
})
```

El par `focus`/`blur` no es opcional: sin él la grilla es inerte para quien navega
con teclado.

## Móvil: reproducir lo visible, no todo

En táctil no hay hover. Reproduce solo la tarjeta centrada en viewport:

```js
if (matchMedia('(hover: none)').matches) {
  new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target.querySelector('.work__video')
      if (e.isIntersecting) {
        if (!v.src) v.src = v.dataset.src
        v.play().catch(() => {})
      } else v.pause()
    })
  }, { threshold: 0.6 }).observe(...cards)
}
```

## CSS de la grilla

```css
.works {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
  gap: clamp(1rem, 4vw, 3rem);
}

.work__media { position: relative; aspect-ratio: 16 / 9; overflow: hidden; }

.work__poster,
.work__video {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
}

.work__video { opacity: 0; transition: opacity .45s ease; }
.work.is-playing .work__video { opacity: 1; }

.work__poster { transition: transform .6s cubic-bezier(.16,1,.3,1); }
.work:hover .work__poster { transform: scale(1.04); }
```

`minmax(min(100%, 22rem), 1fr)` en vez de `minmax(22rem, 1fr)`: la versión ingenua
desborda horizontalmente en pantallas de menos de 22rem.

## Filtrado por tags

```js
const filter = (tag) => {
  cards.forEach((card) => {
    const match = !tag || card.dataset.tags.split(' ').includes(tag)
    card.hidden = !match
  })
  ScrollTrigger.refresh?.()   // las alturas cambiaron
}
```

Usa `hidden`, no `display:none` vía clase: `hidden` saca el elemento del árbol de
accesibilidad, que es lo correcto. Y acuérdate de refrescar ScrollTrigger si lo usas.

## Codificación de los videos

- H.264 MP4, sin pista de audio (`-an`), `-movflags +faststart`.
- 1280×720 máximo para hovers de grilla; nadie nota más resolución en una tarjeta.
- 3–6 segundos en loop, CRF 26–28.

```bash
ffmpeg -i fuente.mov -an -vf "scale=1280:-2" -c:v libx264 -crf 27 \
       -preset slow -movflags +faststart salida.mp4
```
