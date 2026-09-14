var L = require('../assets/leads.js');
var fails = 0;
function ok(name, cond, extra) {
  if (cond) { console.log('  ✓', name); }
  else { console.log('  ✗', name, extra === undefined ? '' : '→ ' + JSON.stringify(extra)); fails++; }
}

var cfg = L.defaultConfig();

console.log('— Puntaje —');
var ideal = { nombre:'Lucía', empresa:'Escuela de Coaching Avanza', cargo:'Fundadora', industria:'Coaching',
  email:'l@a.com', pais:'España', empleados:8, web:'https://a.com', senal:'busca clientes nuevos', emailVerificado:true };
var r1 = L.scoreLead(ideal, cfg);
ok('lead ideal = 100', r1.score === 100, r1);
ok('lead ideal = Caliente', r1.temperatura === 'Caliente', r1.temperatura);

var vacio = { nombre:'X', empresa:'Y', cargo:'', industria:'', email:'', pais:'', empleados:'', web:'', senal:'', emailVerificado:false };
var r2 = L.scoreLead(vacio, cfg);
ok('lead vacío = 0', r2.score === 0, r2);
ok('lead vacío = Frío', r2.temperatura === 'Frío', r2.temperatura);

var desc = Object.assign({}, ideal, { cargo:'Estudiante de marketing' });
var r3 = L.scoreLead(desc, cfg);
ok('descalificador → Descartado', r3.temperatura === 'Descartado' && r3.score === 0, r3);

// Acentos y mayúsculas no deben importar
var acc = Object.assign({}, ideal, { pais:'MÉXICO' });
ok('país con acento/mayúsculas coincide', L.scoreLead(acc, cfg).cumple.indexOf('País objetivo') !== -1);
var acc2 = Object.assign({}, ideal, { pais:'mexico' });
ok('país sin acento coincide', L.scoreLead(acc2, cfg).cumple.indexOf('País objetivo') !== -1);

// Rango de empleados
ok('empleados fuera de rango no puntúa', L.scoreLead(Object.assign({}, ideal, {empleados:500}), cfg).falla.indexOf('Tamaño de empresa') !== -1);
ok('empleados en el borde superior puntúa', L.scoreLead(Object.assign({}, ideal, {empleados:50}), cfg).cumple.indexOf('Tamaño de empresa') !== -1);
ok('empleados vacío no puntúa', L.scoreLead(Object.assign({}, ideal, {empleados:''}), cfg).falla.indexOf('Tamaño de empresa') !== -1);

// Peso 0 desactiva el criterio y renormaliza
var cfg0 = JSON.parse(JSON.stringify(cfg));
cfg0.pesos.senal = 0;
var sinSenal = Object.assign({}, ideal, { senal:'' });
ok('peso 0 excluye el criterio', L.scoreLead(sinSenal, cfg0).score === 100, L.scoreLead(sinSenal, cfg0));

// Todos los pesos en 0 no debe romper
var cfgZ = JSON.parse(JSON.stringify(cfg));
Object.keys(cfgZ.pesos).forEach(function(k){ cfgZ.pesos[k]=0; });
ok('todos los pesos en 0 → 0 sin error', L.scoreLead(ideal, cfgZ).score === 0);

// Email verificado requiere email válido
ok('verificado sin email válido no puntúa',
   L.scoreLead(Object.assign({}, ideal, {email:'no-es-email', emailVerificado:true}), cfg).falla.indexOf('Email verificado') !== -1);

console.log('— CSV —');
var csv = 'Name,Company,Title,Email,Country,Employees,Website,Industry,Email Status\n' +
          '"Gómez, Martín",Gómez Consultoría,CEO,m@g.com,Argentina,4,https://g.com,Consultoría,verified\n' +
          'Ana Ruiz,Estudio Ruiz,Asistente,ana@r.mx,México,2,,Contabilidad,invalid\n';
var imported = L.leadsFromCSV(csv);
ok('importa 2 filas', imported.length === 2, imported.length);
ok('respeta comas dentro de comillas', imported[0].nombre === 'Gómez, Martín', imported[0].nombre);
ok('mapea encabezados en inglés', imported[0].empresa === 'Gómez Consultoría' && imported[0].cargo === 'CEO');
ok('empleados numérico', imported[0].empleados === 4, imported[0].empleados);
ok('detecta verified', imported[0].emailVerificado === true && imported[1].emailVerificado === false);
ok('estado por defecto Nuevo', imported[0].estado === 'Nuevo');

// CSV con separador ; y encabezados en español
var csv2 = 'nombre;empresa;cargo;email;pais;empleados\nPedro;Impulso;Director;p@i.co;Colombia;22\n';
var imp2 = L.leadsFromCSV(csv2);
ok('soporta separador ;', imp2.length === 1 && imp2[0].empresa === 'Impulso', imp2);

ok('CSV sin encabezados conocidos devuelve vacío', L.leadsFromCSV('a,b,c\n1,2,3\n').length === 0);
ok('CSV vacío no rompe', L.leadsFromCSV('').length === 0);

// Round-trip export → import
var out = L.leadsToCSV(imported, cfg);
ok('export incluye puntaje y temperatura', /puntaje,temperatura,motivo/.test(out.split('\n')[0]));
var back = L.leadsFromCSV(out);
ok('round-trip conserva filas', back.length === 2, back.length);
ok('round-trip conserva nombre con coma', back[0].nombre === 'Gómez, Martín', back[0].nombre);

console.log('— Email —');
var d = L.draftEmail(ideal);
ok('asunto usa la empresa', d.asunto.indexOf('Escuela de Coaching Avanza') !== -1, d.asunto);
ok('cuerpo usa el primer nombre', d.cuerpo.indexOf('Hola Lucía') === 0, d.cuerpo.slice(0,20));
ok('lead sin señal igual genera cuerpo', L.draftEmail({nombre:'', empresa:''}).cuerpo.length > 50);

console.log(fails ? '\nFALLARON ' + fails + ' pruebas' : '\nTodas las pruebas pasaron');
process.exit(fails ? 1 : 0);
