# Lista de leads B2B calificados — sitios web, captación con IA y chatbots

Prospección para la oferta de sitios multipágina, sistemas de captación de leads con IA
y automatización de atención en Instagram y WhatsApp.

Archivo principal: `leads-calificados.csv` — 47 empresas: 30 de prioridad A, 16 de B y 1 de C.

## Cómo se armó

Los datos salen de la base de empresas de Vibe Prospecting (Explorium), consultada por
mercado y por rubro. No hay ningún registro inventado: cada fila corresponde a una empresa
real devuelta por la base, con su dominio tal como figura en la fuente.

El filtro se aplicó **antes** de traer los resultados, no después. Toda empresa de la lista
cumple, por construcción:

| Filtro | Valor |
|---|---|
| Facturación anual | 1.000.000 USD como mínimo |
| Dotación | entre 1 y 200 empleados |
| Rubro | categoría LinkedIn dentro de los rubros pedidos |
| Geografía | país o área metropolitana de los mercados pedidos |

## Por qué todas califican para el ticket de 500 USD

El criterio que diste es que el negocio pueda pagar 500 USD o más por un sitio. El piso de
facturación de 1M USD anuales deja ese ticket en menos del 0,05% de la facturación anual.
Ninguna empresa de la lista es un comercio chico de bajo margen: el corte por facturación
los eliminó antes de la curaduría.

El techo de 200 empleados es igual de deliberado. Por encima de eso aparecen las compañías
con equipo de marketing y desarrollo interno, que no compran este servicio.

## La columna `precision_del_dato`

- **exacto**: la facturación y la dotación vienen verificadas empresa por empresa.
- **rango filtrado**: el valor exacto está enmascarado en la capa gratuita de la fuente, pero
  la empresa pasó el filtro, así que la banda indicada es un piso garantizado, no una
  estimación.

## Curaduría manual

La base devuelve ruido que el filtro no atrapa. Se descartaron a mano, entre otras:

- Asociaciones y sociedades científicas sin fines de lucro (Adecra, SEOM, Abogadas MX,
  Consejo General de Enfermería).
- Software y marketplaces del rubro, no operadores (Homie.mx, Tabas, PoloTab, GoWabi,
  VIWELL, Vittude).
- Medios y directorios del sector (Inmobiliare, Abogados.com.ar, The World's 50 Best).
- Proveedores B2B del rubro, no el negocio final (Gastrosophia, Al Husseini Medical,
  APEX Medical Billing, Arthur Marshall).
- Cadenas masivas y organismos públicos (KFC Thailand, TCEB).
- Medicina laboral y ocupacional, que no vende al consumidor final.

## Las cinco cuentas con el gancho más fuerte

Estas facturan 1M USD o más y **no tienen sitio web propio**. Su presencia digital es un
Instagram, un Linktree, un Calendly o un link-in-bio. El argumento de venta no hay que
construirlo.

| Empresa | Mercado | Presencia actual |
|---|---|---|
| Puerto & Cía (RE/MAX Puerto) | CABA | Instagram |
| Morelia Caballito | CABA | Instagram |
| Clínica Healthy | São Paulo | Linktree |
| Luxury Life Homes | Miami | Calendly |
| Pryce Marshall Land & Home | Fort Worth | link-in-bio |

## Cobertura por mercado

| Mercado | Leads |
|---|---|
| Argentina (CABA y Zona Norte GBA) | 11 |
| México | 4 |
| Brasil y Panamá | 6 |
| Estados Unidos | 7 |
| Europa | 8 |
| Emiratos Árabes Unidos | 7 |
| Tailandia | 4 |

## Prioridades

- **A**: rubro, geografía y capacidad de pago alineados, más una señal concreta de dolor
  (sin web, ticket muy alto, o competencia por leads pagos). Atacar primero.
- **B**: califica sin discusión, pero el gancho es menos evidente.
- **C**: califica por los números; la geografía o el posicionamiento se corren del foco.

## Lo que falta

La consigna se cortó en el criterio 1 de calificación ("Descartar comercios chicos de bajo
marg..."). Si había criterios 2, 3 y siguientes, no llegaron, así que se aplicó el criterio de
ticket completo más los cortes de dotación y rubro descritos arriba.

Los registros no traen teléfono ni email de contacto. La base los tiene detrás de un
enriquecimiento pago; el volumen actual de créditos alcanza para unas pocas cuentas por vez.

## Nota sobre publicación

Este repositorio sirve un sitio estático desde la raíz. Si el deploy publica el repo
completo, esta carpeta queda accesible desde internet. No hay datos personales acá, solo
nombres de empresa y sitios públicos, pero es la lista de prospección comercial: conviene
excluir `prospeccion/` del build o moverla a un repo privado.
