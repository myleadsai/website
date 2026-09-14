# Pruebas

## Motor de calificación y CSV (Node, sin dependencias)

```bash
node tests/test-leads.js
```

Cubre el puntaje (lead ideal, lead vacío, descalificadores, rangos, pesos en 0,
acentos) y el CSV (comillas, separadores `,` y `;`, encabezados en inglés y
español, ida y vuelta export → import).

## Extremo a extremo (navegador, requiere Playwright)

Con el sitio servido en el puerto 8099:

```bash
npx http-server -p 8099 -s .          # en otra terminal
node tests/test-e2e.js
```

Recorre las tres páginas: catálogo, filtros, configurador, descarga y contenido del
blueprint, persistencia, y en la consola: alta, importación, filtros, buscador,
recálculo al mover pesos, estados, exportación y ausencia de scroll horizontal en móvil.
Las capturas quedan en el directorio temporal del sistema.
