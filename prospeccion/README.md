# Prospección B2B — sitios web, captación con IA y automatización IG/WhatsApp

Dataset: `leads-b2b-2026-09.csv` — 73 leads calificados. Corte: 11/09/2026.

## Criterio de calificación

El brief llegó cortado después del criterio 1 ("ticket ≥ 500 USD, descartar comercios chicos de
bajo margen"). El resto del rubro lo definí yo y está sujeto a tu confirmación:

| Dimensión | Puntos | Cómo se evalúa |
|---|---|---|
| Capacidad de pago | 30 | Rubro de alto margen y ticket por cliente. Un implante dental o una operación inmobiliaria cubren el sitio completo. |
| Dolor digital | 30 | Sin web = 30. Solo Instagram o Facebook = 25. Booking de terceros sin dominio propio = 22. Web propia desactualizada = 18. Web propia correcta = 8. |
| Demanda probada | 20 | Reseñas de Google: más de 500 = 20, entre 200 y 500 = 15, entre 80 y 200 = 10, menos de 80 = 5. |
| Encaje con la oferta | 10 | Rubros donde la consulta entra por DM o WhatsApp y hoy se responde a mano. |
| Accionabilidad | 10 | Teléfono y ficha verificados = 10. Solo dominio = 4. |

Prioridades: **P1** 76 o más, **P2** entre 62 y 75, **P3** entre 55 y 61.

## Grado del dato

La columna `grado_dato` dice qué tan lista está cada fila para llamar:

- **A (28 leads)** — nombre, dirección, teléfono, sitio, rating, reseñas y estado de la ficha, todo
  verificado contra Google Business Profile. Se puede llamar hoy.
- **B (21 leads)** — nombre, dirección y canal digital verificados. Falta el teléfono.
- **C (24 leads)** — empresa y dominio identificados. Falta teléfono, email y handle de Instagram.

## Los mejores ángulos de entrada

Los diez primeros de la lista no son los más grandes sino los que tienen la brecha más visible
entre demanda y presencia digital. Tres patrones se repiten:

1. **Mucha reseña, cero web.** Odonto Maipú tiene 413 reseñas y ningún sitio. Ayres Dental tiene
   5.0 con 305 reseñas y solo Instagram. Tosiponti suma 884 reseñas y también solo Instagram.
2. **Ficha sin reclamar.** Coin y San Isidro Labrador no controlan su propia ficha de Google y
   arrastran ratings de 2.3 y 2.7. Ahí la venta empieza por reputación, no por diseño.
3. **Rating bajo con volumen alto.** Centro Chouela tiene 2.9 con 234 reseñas. Ese patrón casi
   siempre es falta de respuesta y seguimiento, que es exactamente lo que resuelve el bot.

Toda la vertical de estudios contables de CABA (leads 45 a 49) no tiene sitio web. Es el lote más
homogéneo para una campaña con un mismo mensaje.

## Cobertura y huecos

Cubierto con dato de contacto real: CABA y Zona Norte del GBA, en estética, dermatología,
odontología, clínica capilar y estudios contables.

Cubierto solo a nivel empresa y dominio: Dubái, Abu Dhabi, Miami, Fort Lauderdale, Riviera Maya,
Madrid, Barcelona, Balneário Camboriú, Milán.

**Sin cubrir todavía:** CDMX, Monterrey, Guadalajara, Cancún, Bogotá, Medellín, Santiago, Panamá,
Punta del Este, São Paulo, Marbella, Lisboa, París, Londres, Scottsdale, Austin, Dallas, Los
Ángeles, San Diego, Naples y toda Tailandia. Tampoco hay todavía concesionarias premium,
constructoras, estudios jurídicos ni gastronomía de ticket alto.

El hueco no es por falta de criterio sino de crédito. Ver abajo.

## Por qué se frenó acá

Tres fuentes de datos, tres situaciones distintas:

| Fuente | Qué entrega | Saldo al cierre |
|---|---|---|
| OpenSEO (Google Business Profile) | Teléfono, sitio, rating, reseñas, estado de la ficha | 0 créditos |
| BirdSift (Google Places) | Lo mismo más chequeo en vivo de si el sitio es viejo o no responsive | 3 créditos |
| Vibe Prospecting (base LinkedIn) | Nombre y dominio, sin contacto | Exploración gratis, export sin usar |

OpenSEO cobró 27 créditos por 25 registros, es decir algo más de 1 crédito por lead. Los 39
créditos iniciales rindieron 35 registros, de los que 28 pasaron el filtro de rubro y quedaron como grado A.

Vibe Prospecting es gratis para explorar pero su base viene de LinkedIn, y para este ICP devuelve
mucho ruido: en la búsqueda de hoteles en Tailandia trajo una asociación hotelera, una
consultora y una plataforma de analytics. Para inmobiliarias en Reino Unido devolvió cero
resultados. Sirve para identificar empresas, no para armar una lista de llamadas.

## Cómo seguir

La lista se completa comprando crédito en la fuente correcta. Los números, a razón de un crédito
por lead:

- **Cerrar los 24 leads de grado C** (teléfono e Instagram): unos 25 créditos.
- **Cada ciudad y rubro nuevo**, a 25 leads por búsqueda: unos 27 créditos. Las 20 ciudades
  pendientes con dos rubros cada una son unos 1.100 créditos.
- **BirdSift conviene para el filtro de sitio viejo o no responsive**, que es el hook de venta más
  directo, pero esa verificación en vivo hace que cada búsqueda tarde cerca de 45 segundos.

Decime hasta dónde querés llegar y con qué presupuesto y sigo por ciudad, priorizando las que
más se parecen a lo que ya funcionó: zonas de alto poder adquisitivo con clínicas y estudios que
venden por Instagram sin sitio propio.

## Nota sobre los datos

Todas las filas salen de fichas públicas de Google Business Profile o de perfiles públicos de
empresa. No hay datos personales de contactos individuales ni emails inferidos. Antes de una
campaña de salida conviene revisar el marco de datos personales de cada mercado, sobre todo
Europa y Emiratos.
