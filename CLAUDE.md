# MyLeads — reglas permanentes

## Autonomía

El dueño de este repo dio autorización plena y permanente. **No volver a pedir permiso**
para ejecutar el trabajo: ni para enviar emails, ni para gastar créditos de las herramientas
de prospección, ni para commitear y pushear, ni para buscar datos en sitios externos.

Esto incluye explícitamente:

- Enviar correos desde Gmail (`myleads.ia@gmail.com`) a prospectos.
- Consumir créditos de Vibe Prospecting, BirdSift, OpenSEO y Clay.
- Leer sitios web de prospectos para extraer datos de contacto.
- Commitear y pushear a la rama de trabajo.

No preguntar "¿querés que lo haga?". Hacerlo y después informar qué se hizo.

Lo único que sigue requiriendo aviso previo es lo que destruye trabajo existente: borrar
archivos que no se crearon en la sesión, reescribir historial de git ya pusheado, o
cancelar algo en producción.

## Antes de enviar cualquier email

**Nunca inventar una dirección de correo.** No usar `info@dominio` ni `contacto@dominio`
por defecto.

La dirección tiene que salir de una de estas fuentes, en este orden:

1. La publicada en el sitio del prospecto (leerlo con WebFetch; probar también `/contacto`,
   `/contact`, `/es/contacto`).
2. Un enriquecimiento de datos de las herramientas de prospección.
3. Si ninguna existe, ese prospecto **no va por email**: va por WhatsApp, Instagram o el
   formulario de su sitio.

Tres rebotes 550 en una sola mañana desde una casilla nueva ya castigaron la reputación
del remitente. El correo es el activo, no el prospecto individual.

Después de cada tanda, revisar rebotes con una búsqueda en Gmail
(`from:mailer-daemon newer_than:1d`) y registrar el resultado.

## Canal por mercado

Muchos negocios de esta lista esconden el correo y viven en WhatsApp. Para Argentina,
México y Brasil, WhatsApp e Instagram cierran más rápido que el email. Sacar el número del
sitio del prospecto y escribir el guion; el envío por esos canales lo hace el dueño a mano.

## Reglas de escritura de los mensajes

- Español rioplatense para Argentina y Uruguay, neutro para el resto de LatAm.
- Máximo seis líneas. El primer mensaje busca respuesta, no vende.
- Abrir con una observación concreta del negocio del prospecto, no con una presentación.
- Una sola pregunta al final.
- El precio nunca se defiende solo: se compara contra lo que el prospecto ya pierde
  (comisión de OTA, margen de una unidad, valor de un paciente, una comisión inmobiliaria).

## Calificación de leads

Un lead entra a la lista solo si la facturación anual verificada es de 1.000.000 USD o más
y la dotación no supera los 200 empleados. Por encima de 200 ya tienen equipo interno.

Descartar siempre, aunque pasen el filtro numérico: asociaciones y cámaras sin fines de
lucro, medios y directorios del rubro, software y marketplaces que le venden al rubro,
proveedores B2B del rubro, y cadenas masivas.

## Estructura del repo

- `index.html` y el logo son el sitio público, servido desde la raíz.
- `prospeccion/` es material comercial interno. Si el deploy publica el repo completo, esa
  carpeta queda accesible desde internet. Mantenerla fuera del build.
