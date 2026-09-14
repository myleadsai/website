/* ==========================================================================
   Myleads.ai — Consola de Leads
   Motor de calificación + gestión de la lista. Todo vive en el navegador.
   ========================================================================== */
(function (global) {
  'use strict';

  var KEY_CONFIG = 'myleads.leads.config.v1';
  var KEY_LEADS = 'myleads.leads.data.v1';

  var ESTADOS = ['Nuevo', 'Contactado', 'Respondió', 'Reunión agendada', 'Cliente', 'Perdido'];

  /* =========================== Motor de puntaje =========================== */

  /* Quita acentos y normaliza, para que "México" y "mexico" sean lo mismo. */
  function norm(s) {
    return String(s === undefined || s === null ? '' : s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  }

  function toList(s) {
    if (Array.isArray(s)) return s.map(norm).filter(Boolean);
    return norm(s).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function matchAny(text, keywords) {
    var t = norm(text);
    if (!t) return false;
    return keywords.some(function (k) { return k && t.indexOf(k) !== -1; });
  }

  /* Criterios de calificación. Cada uno vale lo que diga su peso. */
  var CRITERIOS = [
    {
      key: 'industria',
      label: 'Industria objetivo',
      help: 'La industria o el nombre de la empresa coincide con tus nichos.',
      test: function (lead, icp) {
        return matchAny(lead.industria + ' ' + lead.empresa, toList(icp.industrias));
      }
    },
    {
      key: 'cargo',
      label: 'Cargo con decisión',
      help: 'El cargo del contacto puede decidir una compra.',
      test: function (lead, icp) {
        return matchAny(lead.cargo, toList(icp.cargos));
      }
    },
    {
      key: 'pais',
      label: 'País objetivo',
      help: 'El lead está en uno de los países que atendés.',
      test: function (lead, icp) {
        return matchAny(lead.pais, toList(icp.paises));
      }
    },
    {
      key: 'tamano',
      label: 'Tamaño de empresa',
      help: 'La cantidad de empleados entra en tu rango.',
      test: function (lead, icp) {
        var n = Number(lead.empleados);
        if (!isFinite(n) || lead.empleados === '' || lead.empleados === null) return false;
        var min = Number(icp.empleadosMin);
        var max = Number(icp.empleadosMax);
        if (!isFinite(min)) min = 0;
        if (!isFinite(max) || max <= 0) max = Infinity;
        return n >= min && n <= max;
      }
    },
    {
      key: 'email',
      label: 'Email verificado',
      help: 'Tiene un email válido y verificado: se le puede escribir.',
      test: function (lead) {
        return !!lead.emailVerificado && /\S+@\S+\.\S+/.test(String(lead.email || ''));
      }
    },
    {
      key: 'web',
      label: 'Sitio web activo',
      help: 'Tiene web propia: señal de negocio real en marcha.',
      test: function (lead) {
        return !!String(lead.web || '').trim();
      }
    },
    {
      key: 'senal',
      label: 'Señal de intención',
      help: 'Hay una señal concreta de que necesita lo que vendés.',
      test: function (lead, icp) {
        var keys = toList(icp.senales);
        if (!keys.length) return !!String(lead.senal || '').trim();
        return matchAny(lead.senal + ' ' + lead.notas, keys);
      }
    }
  ];

  function defaultConfig() {
    return {
      icp: {
        industrias: 'coach, consultor, consultoría, agencia, mentor, formación, infoproducto, academia',
        cargos: 'fundador, founder, ceo, dueño, socio, director, gerente de marketing, cmo',
        paises: 'argentina, españa, méxico, colombia, chile, perú, uruguay',
        empleadosMin: 1,
        empleadosMax: 50,
        senales: 'busca clientes, invierte en ads, lanzó curso, contrata marketing, escalar, automatizar',
        descalificadores: 'estudiante, becario, reclutador, recruiter, buscando empleo, sin web'
      },
      pesos: {
        industria: 20,
        cargo: 20,
        pais: 10,
        tamano: 10,
        email: 15,
        web: 10,
        senal: 15
      },
      umbrales: { caliente: 70, tibio: 40 }
    };
  }

  /* Devuelve puntaje 0-100, temperatura y el porqué (criterios cumplidos y no). */
  function scoreLead(lead, config) {
    var icp = config.icp || {};
    var pesos = config.pesos || {};
    var umbrales = config.umbrales || {};

    var descartes = toList(icp.descalificadores);
    var blob = [lead.nombre, lead.empresa, lead.cargo, lead.industria, lead.senal, lead.notas].join(' ');
    if (descartes.length && matchAny(blob, descartes)) {
      return {
        score: 0,
        temperatura: 'Descartado',
        cumple: [],
        falla: ['Coincide con un descalificador'],
        motivo: 'Descalificado automáticamente por el filtro.'
      };
    }

    var total = 0, obtenido = 0, cumple = [], falla = [];
    CRITERIOS.forEach(function (c) {
      var peso = Number(pesos[c.key]);
      if (!isFinite(peso) || peso <= 0) return;   // peso 0 = criterio apagado
      total += peso;
      if (c.test(lead, icp)) {
        obtenido += peso;
        cumple.push(c.label);
      } else {
        falla.push(c.label);
      }
    });

    var score = total > 0 ? Math.round((obtenido / total) * 100) : 0;
    var hot = Number(umbrales.caliente);
    var warm = Number(umbrales.tibio);
    if (!isFinite(hot)) hot = 70;
    if (!isFinite(warm)) warm = 40;

    var temperatura = score >= hot ? 'Caliente' : (score >= warm ? 'Tibio' : 'Frío');
    return {
      score: score,
      temperatura: temperatura,
      cumple: cumple,
      falla: falla,
      motivo: cumple.length ? 'Cumple: ' + cumple.join(', ') + '.' : 'No cumple ningún criterio activo.'
    };
  }

  /* ============================== CSV ============================== */

  /* Parser tolerante: soporta comillas, comas y saltos de línea dentro del campo. */
  function parseCSV(text) {
    var rows = [], row = [], field = '', inQuotes = false;
    text = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += ch;
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',' || ch === ';') {
        row.push(field); field = '';
      } else if (ch === '\n') {
        row.push(field); field = '';
        if (row.some(function (c) { return c.trim() !== ''; })) rows.push(row);
        row = [];
      } else field += ch;
    }
    row.push(field);
    if (row.some(function (c) { return c.trim() !== ''; })) rows.push(row);
    return rows;
  }

  /* Encabezados que sabemos reconocer, vengan de donde vengan.
     OJO: los términos en inglés de esta lista NO se traducen. Son los
     encabezados literales que exportan Apollo, Instantly, Apify y compañía;
     si se traducen, la importación de esos CSV deja de funcionar. */
  var ALIAS = {
    nombre: ['nombre', 'name', 'full name', 'nombre completo', 'contacto', 'first name', 'firstname'],
    empresa: ['empresa', 'company', 'company name', 'organizacion', 'organization', 'compania', 'negocio'],
    cargo: ['cargo', 'title', 'job title', 'puesto', 'position', 'rol'],
    email: ['email', 'e-mail', 'correo', 'mail', 'email address'],
    pais: ['pais', 'country', 'ubicacion', 'location'],
    empleados: ['empleados', 'employees', 'company size', 'tamano', 'headcount', 'num employees'],
    web: ['web', 'website', 'sitio', 'sitio web', 'url', 'domain', 'dominio'],
    industria: ['industria', 'industry', 'sector', 'nicho', 'rubro'],
    senal: ['senal', 'signal', 'intent', 'intencion', 'senal de intencion', 'trigger'],
    emailVerificado: ['verificado', 'verified', 'email verificado', 'email status', 'email verified'],
    notas: ['notas', 'notes', 'comentarios', 'nota'],
    estado: ['estado', 'status', 'etapa']
  };

  function mapHeaders(headerRow) {
    var map = {};
    headerRow.forEach(function (h, i) {
      var n = norm(h);
      Object.keys(ALIAS).forEach(function (campo) {
        if (map[campo] !== undefined) return;
        if (ALIAS[campo].indexOf(n) !== -1) map[campo] = i;
      });
    });
    return map;
  }

  function truthy(v) {
    var n = norm(v);
    return n === 'true' || n === 'si' || n === 'sí' || n === 'yes' || n === '1' ||
           n === 'verificado' || n === 'verified' || n === 'valid';
  }

  function leadsFromCSV(text) {
    var rows = parseCSV(text);
    if (rows.length < 2) return [];
    var map = mapHeaders(rows[0]);
    if (Object.keys(map).length === 0) return [];

    function cell(row, campo) {
      var i = map[campo];
      return i === undefined ? '' : String(row[i] === undefined ? '' : row[i]).trim();
    }

    return rows.slice(1).map(function (row) {
      var empleados = cell(row, 'empleados').replace(/[^0-9]/g, '');
      var estado = cell(row, 'estado');
      return {
        nombre: cell(row, 'nombre'),
        empresa: cell(row, 'empresa'),
        cargo: cell(row, 'cargo'),
        email: cell(row, 'email'),
        pais: cell(row, 'pais'),
        empleados: empleados === '' ? '' : Number(empleados),
        web: cell(row, 'web'),
        industria: cell(row, 'industria'),
        senal: cell(row, 'senal'),
        notas: cell(row, 'notas'),
        emailVerificado: truthy(cell(row, 'emailVerificado')),
        estado: ESTADOS.indexOf(estado) !== -1 ? estado : 'Nuevo'
      };
    }).filter(function (l) {
      return l.nombre || l.empresa || l.email;
    });
  }

  function csvEscape(v) {
    var s = v === undefined || v === null ? '' : String(v);
    return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function leadsToCSV(leads, config) {
    var cols = ['nombre', 'empresa', 'cargo', 'email', 'pais', 'empleados', 'web', 'industria', 'senal', 'emailVerificado', 'estado', 'notas'];
    var head = cols.concat(['puntaje', 'temperatura', 'motivo']);
    var lines = [head.join(',')];
    leads.forEach(function (l) {
      var r = scoreLead(l, config);
      var vals = cols.map(function (c) { return csvEscape(l[c]); });
      vals.push(r.score, csvEscape(r.temperatura), csvEscape(r.motivo));
      lines.push(vals.join(','));
    });
    return lines.join('\n');
  }

  /* ====================== Email de primer contacto ====================== */
  function draftEmail(lead) {
    var nombre = String(lead.nombre || '').split(' ')[0] || 'Hola';
    var empresa = lead.empresa || 'tu negocio';
    var gancho = lead.senal
      ? 'Vi que ' + lead.senal.charAt(0).toLowerCase() + lead.senal.slice(1) + '.'
      : 'Vi lo que están construyendo en ' + empresa + '.';
    return {
      asunto: 'Una idea para ' + empresa,
      cuerpo: 'Hola ' + nombre + ',\n\n' + gancho + '\n\n' +
        'En Myleads.ai ayudamos a ' + (lead.industria || 'negocios como el tuyo') +
        ' a montar un sistema que capta y califica clientes en automático, sin depender de referidos.\n\n' +
        '¿Te viene bien una llamada de 15 minutos esta semana para ver si aplica a ' + empresa + '?\n\n' +
        'Franco — Myleads.ai\nhttps://calendly.com/myleads-ia/30min'
    };
  }

  /* Núcleo exportado (también se usa en las pruebas de Node). */
  var core = {
    ESTADOS: ESTADOS,
    CRITERIOS: CRITERIOS,
    defaultConfig: defaultConfig,
    scoreLead: scoreLead,
    parseCSV: parseCSV,
    leadsFromCSV: leadsFromCSV,
    leadsToCSV: leadsToCSV,
    draftEmail: draftEmail,
    norm: norm
  };
  global.MyleadsLeads = core;
  if (typeof module !== 'undefined' && module.exports) module.exports = core;

  /* ============================ Interfaz ============================ */
  if (typeof document === 'undefined' || !document.getElementById('leads-body')) return;

  var config = load(KEY_CONFIG, defaultConfig());
  var leads = load(KEY_LEADS, []);
  var editingId = null;

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed === null ? fallback : parsed;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { toast('No se pudo guardar en este navegador.'); }
  }

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }
  function uid() { return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* ---------- Panel de configuración ---------- */
  var ICP_FIELDS = {
    'icp-industrias': 'industrias',
    'icp-cargos': 'cargos',
    'icp-paises': 'paises',
    'icp-senales': 'senales',
    'icp-descarta': 'descalificadores',
    'icp-min': 'empleadosMin',
    'icp-max': 'empleadosMax'
  };

  function paintConfig() {
    Object.keys(ICP_FIELDS).forEach(function (id) {
      $(id).value = config.icp[ICP_FIELDS[id]];
    });
    $('th-hot').value = config.umbrales.caliente;
    $('th-warm').value = config.umbrales.tibio;

    var box = $('weights');
    box.innerHTML = '';
    CRITERIOS.forEach(function (c) {
      var row = el('div', 'weight-row');
      var top = el('div', 'top');
      var lb = el('label', null, c.label);
      lb.htmlFor = 'w-' + c.key;
      var out = el('output', null, config.pesos[c.key] + ' pts');
      top.appendChild(lb);
      top.appendChild(out);
      row.appendChild(top);

      var range = el('input');
      range.type = 'range';
      range.id = 'w-' + c.key;
      range.min = 0;
      range.max = 30;
      range.step = 1;
      range.value = config.pesos[c.key];
      range.addEventListener('input', function () {
        config.pesos[c.key] = Number(range.value);
        out.textContent = range.value + ' pts';
        persistConfig();
      });
      row.appendChild(range);
      row.appendChild(el('div', 'help', c.help));
      box.appendChild(row);
    });
  }

  function persistConfig() {
    save(KEY_CONFIG, config);
    render();
  }

  Object.keys(ICP_FIELDS).forEach(function (id) {
    $(id).addEventListener('input', function () {
      var campo = ICP_FIELDS[id];
      var v = $(id).value;
      config.icp[campo] = (campo === 'empleadosMin' || campo === 'empleadosMax') ? Number(v) : v;
      persistConfig();
    });
  });
  ['th-hot', 'th-warm'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      config.umbrales[id === 'th-hot' ? 'caliente' : 'tibio'] = Number($(id).value);
      persistConfig();
    });
  });
  $('reset-config').addEventListener('click', function () {
    config = defaultConfig();
    save(KEY_CONFIG, config);
    paintConfig();
    render();
    toast('Configuración restaurada.');
  });

  /* ---------- Tabla ---------- */
  function scoreColor(temp) {
    if (temp === 'Caliente') return 'var(--hot)';
    if (temp === 'Tibio') return 'var(--warm)';
    if (temp === 'Descartado') return 'var(--light-text-color)';
    return 'var(--cold)';
  }
  function tempClass(temp) {
    if (temp === 'Caliente') return 'tag tag-hot';
    if (temp === 'Tibio') return 'tag tag-warm';
    if (temp === 'Descartado') return 'tag tag-off';
    return 'tag tag-cold';
  }

  function visibleLeads() {
    var q = norm($('search').value);
    var ft = $('filter-temp').value;
    var fs = $('filter-status').value;
    var sort = $('sort-by').value;

    var rows = leads.map(function (l) {
      return { lead: l, res: scoreLead(l, config) };
    }).filter(function (r) {
      if (ft && r.res.temperatura !== ft) return false;
      if (fs && (r.lead.estado || 'Nuevo') !== fs) return false;
      if (q) {
        var blob = norm([r.lead.nombre, r.lead.empresa, r.lead.email, r.lead.cargo].join(' '));
        if (blob.indexOf(q) === -1) return false;
      }
      return true;
    });

    rows.sort(function (a, b) {
      if (sort === 'nombre') return String(a.lead.nombre).localeCompare(String(b.lead.nombre), 'es');
      if (sort === 'empresa') return String(a.lead.empresa).localeCompare(String(b.lead.empresa), 'es');
      if (sort === 'fecha') return (b.lead.creado || 0) - (a.lead.creado || 0);
      return b.res.score - a.res.score;
    });
    return rows;
  }

  function renderStats() {
    var scored = leads.map(function (l) { return scoreLead(l, config); });
    var calientes = scored.filter(function (r) { return r.temperatura === 'Caliente'; }).length;
    var tibios = scored.filter(function (r) { return r.temperatura === 'Tibio'; }).length;
    var contactados = leads.filter(function (l) { return l.estado && l.estado !== 'Nuevo'; }).length;
    var clientes = leads.filter(function (l) { return l.estado === 'Cliente'; }).length;
    var reuniones = leads.filter(function (l) { return l.estado === 'Reunión agendada'; }).length;

    var data = [
      { n: leads.length, t: 'Leads totales', c: '' },
      { n: calientes, t: 'Calientes', c: 'hot' },
      { n: tibios, t: 'Tibios', c: 'warm' },
      { n: contactados, t: 'Contactados', c: '' },
      { n: reuniones, t: 'Reuniones', c: '' },
      { n: clientes, t: 'Clientes', c: 'ok' }
    ];
    var box = $('stats');
    box.innerHTML = '';
    data.forEach(function (d) {
      var s = el('div', 'stat' + (d.c ? ' ' + d.c : ''));
      s.appendChild(el('strong', null, String(d.n)));
      s.appendChild(el('span', null, d.t));
      box.appendChild(s);
    });
  }

  function render() {
    renderStats();
    var body = $('leads-body');
    body.innerHTML = '';
    var rows = visibleLeads();

    $('empty-state').hidden = leads.length !== 0;

    rows.forEach(function (r) {
      var l = r.lead, res = r.res;
      var tr = el('tr');

      var tdLead = el('td');
      tdLead.appendChild(el('div', 'lead-name', l.nombre || '(sin nombre)'));
      var sub = [l.cargo, l.empresa].filter(Boolean).join(' · ');
      tdLead.appendChild(el('div', 'lead-sub', sub || l.email || '—'));
      if (l.email) tdLead.appendChild(el('div', 'lead-sub', l.email));
      tr.appendChild(tdLead);

      var tdScore = el('td');
      var cell = el('div', 'score-cell');
      var bar = el('div', 'score-bar');
      var fill = el('i');
      fill.style.width = res.score + '%';
      fill.style.background = scoreColor(res.temperatura);
      bar.appendChild(fill);
      cell.appendChild(bar);
      var num = el('span', 'score-num', String(res.score));
      num.style.color = scoreColor(res.temperatura);
      cell.appendChild(num);
      tdScore.appendChild(cell);
      /* Se muestran los primeros criterios y el resto se resume, para no
         inflar la altura de la fila. El detalle completo está en "Ver". */
      var motivos = res.cumple.length
        ? res.cumple.slice(0, 3).join(' · ') + (res.cumple.length > 3 ? ' +' + (res.cumple.length - 3) : '')
        : 'Sin criterios cumplidos';
      tdScore.appendChild(el('div', 'reasons', motivos));
      tr.appendChild(tdScore);

      var tdTemp = el('td');
      tdTemp.appendChild(el('span', tempClass(res.temperatura), res.temperatura));
      tr.appendChild(tdTemp);

      var tdEstado = el('td');
      var sel = el('select');
      ESTADOS.forEach(function (e) {
        var o = el('option', null, e);
        o.value = e;
        if ((l.estado || 'Nuevo') === e) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () {
        l.estado = sel.value;
        save(KEY_LEADS, leads);
        renderStats();
      });
      tdEstado.appendChild(sel);
      tr.appendChild(tdEstado);

      var tdActions = el('td');
      var acts = el('div', 'row-actions');
      var bDetail = el('button', 'icon-btn', 'Ver');
      bDetail.addEventListener('click', function () { openDetail(l, res); });
      var bEdit = el('button', 'icon-btn', 'Editar');
      bEdit.addEventListener('click', function () { openLeadModal(l); });
      var bDel = el('button', 'icon-btn', '✕');
      bDel.title = 'Eliminar';
      bDel.addEventListener('click', function () {
        if (!confirm('¿Eliminar a ' + (l.nombre || 'este lead') + '?')) return;
        leads = leads.filter(function (x) { return x.id !== l.id; });
        save(KEY_LEADS, leads);
        render();
      });
      acts.appendChild(bDetail);
      acts.appendChild(bEdit);
      acts.appendChild(bDel);
      tdActions.appendChild(acts);
      tr.appendChild(tdActions);

      body.appendChild(tr);
    });

    if (leads.length && !rows.length) {
      var tr2 = el('tr');
      var td2 = el('td', 'empty', 'Ningún lead coincide con los filtros actuales.');
      td2.colSpan = 5;
      tr2.appendChild(td2);
      body.appendChild(tr2);
    }
  }

  /* ---------- Modal de alta / edición ---------- */
  var FORM = {
    'f-nombre': 'nombre', 'f-empresa': 'empresa', 'f-cargo': 'cargo',
    'f-industria': 'industria', 'f-email': 'email', 'f-pais': 'pais',
    'f-empleados': 'empleados', 'f-web': 'web', 'f-senal': 'senal', 'f-notas': 'notas'
  };

  function openLeadModal(lead) {
    editingId = lead ? lead.id : null;
    $('lead-modal-title').textContent = lead ? 'Editar lead' : 'Nuevo lead';
    Object.keys(FORM).forEach(function (id) {
      $(id).value = lead ? (lead[FORM[id]] === undefined || lead[FORM[id]] === null ? '' : lead[FORM[id]]) : '';
    });
    $('f-verificado').checked = lead ? !!lead.emailVerificado : false;
    $('lead-modal').classList.add('open');
  }
  function closeLeadModal() {
    $('lead-modal').classList.remove('open');
    editingId = null;
  }

  $('add-lead').addEventListener('click', function () { openLeadModal(null); });
  $('lead-modal-close').addEventListener('click', closeLeadModal);
  $('lead-cancel').addEventListener('click', closeLeadModal);
  $('lead-save').addEventListener('click', function () {
    var data = {};
    Object.keys(FORM).forEach(function (id) {
      var campo = FORM[id];
      var v = $(id).value.trim();
      data[campo] = campo === 'empleados' ? (v === '' ? '' : Number(v)) : v;
    });
    data.emailVerificado = $('f-verificado').checked;

    if (!data.nombre && !data.empresa && !data.email) {
      toast('Cargá al menos nombre, empresa o email.');
      return;
    }

    if (editingId) {
      leads = leads.map(function (l) {
        return l.id === editingId ? Object.assign({}, l, data) : l;
      });
    } else {
      data.id = uid();
      data.estado = 'Nuevo';
      data.creado = Date.now();
      leads.push(data);
    }
    save(KEY_LEADS, leads);
    closeLeadModal();
    render();
    toast('Lead guardado.');
  });

  /* ---------- Modal de detalle ---------- */
  function openDetail(lead, res) {
    $('detail-title').textContent = lead.nombre || lead.empresa || 'Detalle del lead';
    var body = $('detail-body');
    body.innerHTML = '';

    var head = el('p');
    head.appendChild(el('span', tempClass(res.temperatura), res.temperatura + ' · ' + res.score + '/100'));
    body.appendChild(head);

    var dl = el('div', 'grid-2');
    dl.style.margin = '1rem 0';
    [['Empresa', lead.empresa], ['Cargo', lead.cargo], ['Industria', lead.industria],
     ['País', lead.pais], ['Empleados', lead.empleados], ['Email', lead.email],
     ['Web', lead.web], ['Señal', lead.senal]].forEach(function (pair) {
      if (!pair[1] && pair[1] !== 0) return;
      var d = el('div');
      d.appendChild(el('div', 'small muted', pair[0]));
      d.appendChild(el('div', null, String(pair[1])));
      dl.appendChild(d);
    });
    body.appendChild(dl);

    body.appendChild(el('h3', null, 'Por qué este puntaje'));
    var ul = el('ul');
    ul.style.margin = '0.5rem 0 1rem 1.2rem';
    res.cumple.forEach(function (c) {
      var li = el('li', null, '✓ ' + c);
      li.style.color = 'var(--ok)';
      ul.appendChild(li);
    });
    res.falla.forEach(function (c) {
      var li = el('li', null, '✗ ' + c);
      li.style.color = 'var(--light-text-color)';
      ul.appendChild(li);
    });
    body.appendChild(ul);

    if (lead.notas) {
      body.appendChild(el('h3', null, 'Notas'));
      body.appendChild(el('p', 'muted', lead.notas));
    }

    body.appendChild(el('h3', null, 'Email de primer contacto'));
    var draft = draftEmail(lead);
    var ta = el('textarea');
    ta.id = 'detail-draft';
    ta.style.minHeight = '190px';
    ta.value = 'Asunto: ' + draft.asunto + '\n\n' + draft.cuerpo;
    body.appendChild(ta);

    $('detail-modal').classList.add('open');
  }
  $('detail-close').addEventListener('click', function () { $('detail-modal').classList.remove('open'); });
  $('detail-copy').addEventListener('click', function () {
    var ta = $('detail-draft');
    if (!ta) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ta.value).then(
        function () { toast('Email copiado.'); },
        function () { toast('No se pudo copiar.'); }
      );
    } else { toast('Tu navegador no permite copiar automáticamente.'); }
  });

  [$('lead-modal'), $('detail-modal')].forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) m.classList.remove('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-backdrop.open').forEach(function (m) { m.classList.remove('open'); });
  });

  /* ---------- Importar / exportar ---------- */
  $('import-btn').addEventListener('click', function () { $('import-file').click(); });
  $('import-file').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var nuevos = leadsFromCSV(reader.result);
      if (!nuevos.length) {
        toast('No se reconoció ninguna columna. Revisá los encabezados del CSV.');
        return;
      }
      var existentes = {};
      leads.forEach(function (l) { if (l.email) existentes[norm(l.email)] = true; });
      var agregados = 0, duplicados = 0;
      nuevos.forEach(function (l) {
        if (l.email && existentes[norm(l.email)]) { duplicados++; return; }
        if (l.email) existentes[norm(l.email)] = true;
        l.id = uid();
        l.creado = Date.now();
        leads.push(l);
        agregados++;
      });
      save(KEY_LEADS, leads);
      render();
      toast(agregados + ' leads importados' + (duplicados ? ', ' + duplicados + ' duplicados omitidos.' : '.'));
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  });

  function downloadCSV(filename, csv) {
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  $('export-btn').addEventListener('click', function () {
    if (!leads.length) { toast('No hay leads para exportar.'); return; }
    downloadCSV('myleads-leads.csv', leadsToCSV(leads, config));
    toast('CSV exportado.');
  });
  $('export-qualified').addEventListener('click', function () {
    var calificados = leads.filter(function (l) {
      return scoreLead(l, config).score >= config.umbrales.tibio;
    });
    if (!calificados.length) { toast('Ningún lead supera el umbral de Tibio.'); return; }
    downloadCSV('myleads-leads-calificados.csv', leadsToCSV(calificados, config));
    toast(calificados.length + ' leads calificados exportados.');
  });

  $('clear-btn').addEventListener('click', function () {
    if (!leads.length) return;
    if (!confirm('Esto borra los ' + leads.length + ' leads de la lista. ¿Seguro?')) return;
    leads = [];
    save(KEY_LEADS, leads);
    render();
    toast('Lista vaciada.');
  });

  /* ---------- Ejemplos ---------- */
  $('demo-btn').addEventListener('click', function () {
    var demo = [
      { nombre: 'Lucía Fernández', empresa: 'Escuela de Coaching Avanza', cargo: 'Fundadora', industria: 'Coaching', email: 'lucia@avanza.com', pais: 'España', empleados: 8, web: 'https://avanza.com', senal: 'Publicó que busca escalar sus ventas online', emailVerificado: true },
      { nombre: 'Martín Gómez', empresa: 'Gómez Consultoría', cargo: 'CEO', industria: 'Consultoría', email: 'martin@gomezconsult.com.ar', pais: 'Argentina', empleados: 4, web: 'https://gomezconsult.com.ar', senal: 'Invierte en ads desde hace 3 meses', emailVerificado: true },
      { nombre: 'Ana Ruiz', empresa: 'Estudio Ruiz', cargo: 'Asistente', industria: 'Contabilidad', email: 'ana@estudioruiz.mx', pais: 'México', empleados: 2, web: '', senal: '', emailVerificado: false },
      { nombre: 'Pedro Sánchez', empresa: 'Agencia Impulso', cargo: 'Director de Marketing', industria: 'Agencia', email: 'pedro@impulso.co', pais: 'Colombia', empleados: 22, web: 'https://impulso.co', senal: 'Contrata marketing', emailVerificado: true },
      { nombre: 'Julia Torres', empresa: 'Freelance', cargo: 'Estudiante de marketing', industria: '', email: 'julia@gmail.com', pais: 'Chile', empleados: 1, web: '', senal: '', emailVerificado: false },
      { nombre: 'Rodrigo Díaz', empresa: 'Academia Mentor Pro', cargo: 'Socio', industria: 'Formación', email: 'rodrigo@mentorpro.pe', pais: 'Perú', empleados: 35, web: 'https://mentorpro.pe', senal: 'Lanzó curso nuevo', emailVerificado: true }
    ];
    var agregados = 0;
    demo.forEach(function (d) {
      if (leads.some(function (l) { return norm(l.email) === norm(d.email); })) return;
      d.id = uid();
      d.estado = 'Nuevo';
      d.creado = Date.now();
      d.notas = '';
      leads.push(d);
      agregados++;
    });
    save(KEY_LEADS, leads);
    render();
    toast(agregados ? agregados + ' leads de ejemplo cargados.' : 'Los ejemplos ya estaban cargados.');
  });

  /* ---------- Filtros ---------- */
  ['search', 'filter-temp', 'filter-status', 'sort-by'].forEach(function (id) {
    $(id).addEventListener('input', render);
    $(id).addEventListener('change', render);
  });

  /* ---------- Arranque ---------- */
  (function initEstados() {
    var sel = $('filter-status');
    ESTADOS.forEach(function (e) {
      var o = el('option', null, e);
      o.value = e;
      sel.appendChild(o);
    });
  })();

  paintConfig();
  render();
})(typeof window !== 'undefined' ? window : globalThis);
