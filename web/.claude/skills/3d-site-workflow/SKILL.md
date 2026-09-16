---
name: 3d-site-workflow
description: Proceso completo de 4 fases para producir un sitio web inmersivo 3D de gama alta (tipo alche.jp). Úsala al arrancar un proyecto de sitio 3D/WebGL, al definir alcance y entregables, o cuando haya que decidir qué se construye en WebGL y qué en DOM.
---

# Workflow de sitio 3D inmersivo

Cuatro fases. No saltes a la fase 2 sin cerrar la 1: el 80% de los sitios 3D que fracasan
lo hacen porque se empezó a programar shaders antes de saber qué comunicaba el sitio.

## Fase 1 — Dirección

Antes de abrir el editor, define por escrito:

- **Mensaje único.** Una frase. Si el sitio se pudiera resumir en un cartel, ¿qué diría?
- **La escena ancla.** Un sitio 3D memorable tiene *un* momento — no cinco. En alche.jp
  es la esfera distorsionada del hero. Elige el tuyo y subordina todo lo demás.
- **Presupuesto de peso.** Decide el número ahora, no al final: < 2 MB en el primer
  paint, < 6 MB hasta interactivo completo. Esto determina si puedes usar modelos GLTF
  o si vas a resolverlo con shaders procedurales.
- **Matriz de degradación.** Qué ve un móvil de gama media, qué ve alguien con
  `prefers-reduced-motion`, qué ve alguien sin WebGL. Tres respuestas concretas.

**Entregable:** un documento de una página. Sin esto no se pasa de fase.

## Fase 2 — Sistema visual

- Define tokens antes que componentes: escala tipográfica, paleta, ritmo de espaciado,
  curvas de easing. Las curvas son parte del sistema visual en un sitio 3D, no un detalle.
- Storyboard del scroll: dibuja la página como una tira de film con las transiciones
  marcadas. Cada transición necesita un disparador y una duración definidos aquí.
- Prototipa la escena ancla sola, en un archivo aparte, a 60 fps, antes de integrarla.

**Entregable:** tokens en CSS custom properties + prototipo aislado de la escena ancla.

## Fase 3 — Build

Orden de construcción que evita retrabajo:

1. Estructura HTML semántica completa, sin estilos y sin 3D. Debe leerse bien y ser
   navegable con teclado. Esta es tu capa de fallback y tu SEO.
2. Capa CSS: layout responsive terminado.
3. Scroll suave + orquestación (ver `scroll-choreography`).
4. Capa WebGL encima, como realce (ver `webgl-hero`).

La regla: **el sitio debe funcionar con el canvas eliminado.** Si borrar el `<canvas>`
rompe la navegación o esconde contenido, la arquitectura está mal.

## Fase 4 — Test y entrega

- Perfilar en un dispositivo real de gama media, no en el MacBook del diseñador.
- Verificar: 60 fps sostenidos, sin fugas de memoria al navegar entre vistas, sin
  contextos WebGL huérfanos.
- Accesibilidad: recorrido completo con teclado, `prefers-reduced-motion` respetado,
  contraste de texto sobre capas 3D medido, no estimado.
- Entrega: fuentes, assets originales, documento de la fase 1, y un README de cómo
  correr y desplegar.

## Reparto WebGL vs DOM

| Va en WebGL | Va en DOM |
|---|---|
| Fondos, partículas, distorsión | Todo el texto legible |
| Transiciones de imagen/video | Navegación y enlaces |
| La escena ancla | Formularios |
| Efectos de post-proceso | Contenido indexable |

Texto dentro de WebGL: solo para display tipográfico decorativo, y siempre con el texto
real presente en el DOM (aunque sea visualmente oculto) para lectores de pantalla.
