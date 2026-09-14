# Automatizaciones y Consola de Leads

Dos piezas nuevas en el sitio:

| Página | Para qué sirve | Quién la usa |
|---|---|---|
| `automatizaciones.html` | Catálogo de las 13 automatizaciones, con configurador y descarga del blueprint. | Público (venta) y equipo |
| `leads.html` | Consola interna de captación: puntúa y filtra leads contra nuestro cliente ideal. | Solo el equipo |

Ambas son HTML estático: funcionan tal cual en GitHub Pages, sin backend ni build.

---

## 1. Catálogo de automatizaciones

Las 13 automatizaciones viven en **`assets/automations.js`**. Ese archivo es la única
fuente de verdad: de ahí salen las tarjetas del catálogo, el configurador y el
blueprint que se descarga.

### Cómo usarlo

1. Abrí `automatizaciones.html` y elegí una automatización → **Configurar y crear**.
2. Ajustá los parámetros (nicho, tono, idiomas, integraciones, umbrales…).
   Se guardan solos en el navegador: si volvés, están como los dejaste.
3. Descargá:
   - **Blueprint (n8n)** → en n8n: *Workflows → Import from File*. El primer nodo,
     `Configuración`, trae todos tus valores; editándolo ahí cambiás el comportamiento
     sin tocar el resto del flujo.
   - **Ficha (JSON)** → resumen legible para pasarle al cliente o al implementador.

> El blueprint trae el flujo cableado y la configuración lista. Falta conectar las
> credenciales de cada servicio (OpenAI, Gmail, HubSpot…) dentro de n8n o Make,
> porque las claves no viajan nunca en el archivo.

### Agregar o modificar una automatización

Editá el array `AUTOMATIONS` en `assets/automations.js`. Cada entrada necesita:

```js
{
  id: 'mi-automatizacion',      // usado también para el link directo: #mi-automatizacion
  num: 10,
  name: 'Nombre visible',
  tagline: 'Una línea que la vende.',
  category: 'Prospección',       // agrupa los filtros del catálogo
  summary: 'Qué hace, en 2 o 3 frases.',
  useCase: 'Cómo la usamos nosotros.',
  integrations: ['OpenAI', 'Gmail'],
  nodes: [{ icon: '🌐', label: 'Paso', sub: 'Servicio', type: 'http' }],
  params: [{ key: 'clave', label: 'Etiqueta', type: 'text', def: 'valor' }]
}
```

Tipos de `params` disponibles: `text`, `textarea`, `number`, `email`, `url`,
`select` (con `options`), `multi` (checkboxes, `def` es un array) y `toggle` (booleano).

Los `type` de los nodos se traducen a nodos de n8n según el mapa `NODE_TYPES`
al principio del archivo. Si agregás un tipo nuevo, sumalo también ahí.

El catálogo, los filtros, el contador del título y el configurador se regeneran
solos. Lo único que se duplica a mano es la lista resumida de la home
(`index.html`, sección `#automatizaciones`): si agregás una automatización, sumá
ahí su tarjeta y actualizá el número del título de esa sección.

Las categorías actuales son: Prospección, Contenido, Atención y reservas,
Publicidad y creativos, Operaciones y Reputación. Si usás una categoría nueva,
el filtro aparece solo.

---

## 2. Consola de Leads

Responde a "buscamos leads y necesitamos un filtro que los califique".

### Cómo califica

Cada lead se puntúa de **0 a 100** contra 7 criterios. Cada criterio tiene un peso
que se ajusta con un slider:

| Criterio | Cuándo suma |
|---|---|
| Industria objetivo | La industria o el nombre de la empresa coincide con tus nichos |
| Cargo con decisión | El cargo puede decidir una compra |
| País objetivo | Está en un país que atendés |
| Tamaño de empresa | Los empleados entran en tu rango |
| Email verificado | Tiene email válido **y** verificado |
| Sitio web activo | Tiene web propia |
| Señal de intención | Hay una señal concreta de necesidad |

El puntaje se **normaliza a 100**, así que los pesos no tienen que sumar nada en
particular. Poner un peso en **0 apaga ese criterio** y reparte su valor entre los demás.

Aparte están los **descalificadores**: si alguna de esas palabras aparece en el lead
(nombre, empresa, cargo, industria, señal o notas), va directo a `Descartado` con 0,
sin importar el resto. Sirve para sacar estudiantes, reclutadores o quien no compra.

Los **umbrales** deciden la temperatura: `Caliente` desde 70, `Tibio` desde 40, el
resto `Frío`. Son editables.

Las comparaciones ignoran mayúsculas y acentos: `MÉXICO`, `México` y `mexico` son lo mismo.

### Flujo de trabajo

1. Ajustá el Perfil de Cliente Ideal y los pesos (una sola vez; queda guardado).
2. **Importar CSV** con lo que traiga el scraper, o **+ Agregar lead** a mano.
   También hay **Cargar ejemplos** para probarlo sin datos reales.
3. Ordená por puntaje y trabajá de arriba hacia abajo.
4. **Ver** muestra por qué ese puntaje (criterio por criterio) y genera un borrador
   de email de primer contacto listo para copiar.
5. Movés el estado del lead a medida que avanza: Nuevo → Contactado → Respondió →
   Reunión agendada → Cliente / Perdido.
6. **Exportar solo calificados** baja un CSV con los que superan el umbral de Tibio,
   ya con puntaje y motivo, listo para cargar en Instantly, Smartlead o el CRM.

### Importar CSV

Los encabezados se detectan solos, en español o inglés. Se reconocen:

`nombre`/`name`, `empresa`/`company`, `cargo`/`title`, `email`, `pais`/`country`,
`empleados`/`employees`/`company size`, `web`/`website`/`domain`, `industria`/`industry`,
`senal`/`signal`/`intent`, `verificado`/`email status`, `notas`/`notes`, `estado`/`status`.

Acepta separador `,` o `;`, comillas y comas dentro de los campos. Los leads con un
email ya presente se omiten como duplicados. Las columnas que no reconoce las ignora.

### Dónde se guardan los datos

En el `localStorage` del navegador (claves `myleads.leads.*`). **No se envía nada a
ningún servidor.** Consecuencias:

- Los datos no se comparten entre personas ni entre dispositivos: cada uno ve su lista.
- Si se limpian los datos del navegador, se pierden.
- Para respaldar o compartir con el equipo: **Exportar CSV**.

La página lleva `noindex, nofollow` para que no aparezca en buscadores, pero eso no
es control de acceso: **cualquiera con el link puede abrirla**. No es un problema de
privacidad de datos, porque la lista vive solo en cada navegador, pero tenelo en
cuenta si en algún momento se le agrega un backend.

### Cómo se conecta con las automatizaciones

La automatización **Generación de Leads IA** y el **Captador de Leads 24/7** usan la misma
escala de 0 a 100. El campo *Puntaje mínimo para contactar* del configurador debe
coincidir con el umbral que uses acá, para que el filtro sea el mismo de punta a punta:
el scraper busca, la consola califica, y solo lo calificado recibe outreach.

---

## Pruebas

El motor de calificación y el CSV son funciones puras, sin DOM, así que se prueban
en Node. Con el sitio servido (`npx http-server -p 8099 .`) también corren las
pruebas de navegador con Playwright.
