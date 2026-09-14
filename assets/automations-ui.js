/* ==========================================================================
   Myleads.ai — Catálogo de automatizaciones: render, filtros y configurador.
   ========================================================================== */
(function () {
  'use strict';

  var API = window.MyleadsAutomations;
  var STORAGE_KEY = 'myleads.automations.config.v1';

  var grid = document.getElementById('grid');
  var filters = document.getElementById('filters');
  var backdrop = document.getElementById('modal-backdrop');
  var toastEl = document.getElementById('toast');

  var current = null;   // automatización abierta
  var config = null;    // configuración en edición

  /* ------------------------------ utilidades ------------------------------ */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  function slug(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* Configuraciones guardadas por automatización (persisten en el navegador). */
  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveConfig(id, cfg) {
    try {
      var all = loadSaved();
      all[id] = cfg;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) { /* modo privado: seguimos sin persistir */ }
  }

  /* ------------------------------- diagrama ------------------------------- */
  function renderFlow(container, automation) {
    container.innerHTML = '';
    automation.nodes.forEach(function (n, i) {
      if (i > 0) container.appendChild(el('div', 'flow-arrow', '→'));
      var node = el('div', 'flow-node');
      node.appendChild(el('div', 'dot', n.icon));
      node.appendChild(el('strong', null, n.label));
      node.appendChild(el('span', null, n.sub));
      container.appendChild(node);
    });
  }

  /* ------------------------------- catálogo ------------------------------- */
  function renderCard(a) {
    var card = el('article', 'card auto-card');
    card.dataset.category = a.category;

    var head = el('div', 'head');
    head.appendChild(el('div', 'num', String(a.num)));
    var titles = el('div');
    titles.appendChild(el('h3', null, a.name));
    titles.appendChild(el('div', 'tagline', a.tagline));
    head.appendChild(titles);
    card.appendChild(head);

    var flow = el('div', 'flow flow-compact');
    renderFlow(flow, a);
    card.appendChild(flow);

    card.appendChild(el('p', 'summary', a.summary));

    var uc = el('p', 'use-case');
    uc.appendChild(el('strong', null, 'Cómo lo usamos: '));
    uc.appendChild(document.createTextNode(a.useCase));
    card.appendChild(uc);

    var ints = el('div', 'integrations');
    a.integrations.forEach(function (i) { ints.appendChild(el('span', 'tag', i)); });
    card.appendChild(ints);

    var actions = el('div', 'actions');
    var btn = el('button', 'btn btn-primary btn-sm', 'Configurar y crear');
    btn.addEventListener('click', function () { openModal(a.id); });
    actions.appendChild(btn);
    var link = el('a', 'btn btn-ghost btn-sm', 'Hablar con el equipo');
    link.href = 'https://calendly.com/myleads-ia/30min';
    actions.appendChild(link);
    card.appendChild(actions);

    return card;
  }

  function renderCatalog(category) {
    grid.innerHTML = '';
    API.list
      .filter(function (a) { return !category || a.category === category; })
      .forEach(function (a) { grid.appendChild(renderCard(a)); });
  }

  function renderFilters() {
    var cats = [];
    API.list.forEach(function (a) {
      if (cats.indexOf(a.category) === -1) cats.push(a.category);
    });

    function make(label, value) {
      var b = el('button', 'filter-btn', label);
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(filters.children, function (c) { c.classList.remove('active'); });
        b.classList.add('active');
        renderCatalog(value);
      });
      return b;
    }

    var all = make('Todas (' + API.list.length + ')', null);
    all.classList.add('active');
    filters.appendChild(all);
    cats.forEach(function (c) {
      var count = API.list.filter(function (a) { return a.category === c; }).length;
      filters.appendChild(make(c + ' (' + count + ')', c));
    });
  }

  /* ----------------------------- configurador ----------------------------- */
  function fieldFor(param) {
    var wrap = el('div', 'field');
    var id = 'p-' + param.key;
    var value = config[param.key];

    if (param.type === 'toggle') {
      var row = el('div', 'checkbox-row');
      var cb = el('input');
      cb.type = 'checkbox';
      cb.id = id;
      cb.checked = !!value;
      cb.addEventListener('change', function () { update(param.key, cb.checked); });
      var lb = el('label', null, param.label);
      lb.htmlFor = id;
      row.appendChild(cb);
      row.appendChild(lb);
      wrap.appendChild(row);
      if (param.help) wrap.appendChild(el('div', 'help', param.help));
      return wrap;
    }

    var label = el('label', null, param.label);
    label.htmlFor = id;
    wrap.appendChild(label);

    if (param.type === 'multi') {
      var box = el('div');
      param.options.forEach(function (opt, i) {
        var row2 = el('div', 'checkbox-row');
        var cb2 = el('input');
        cb2.type = 'checkbox';
        cb2.id = id + '-' + i;
        cb2.checked = (value || []).indexOf(opt) !== -1;
        cb2.addEventListener('change', function () {
          var list = (config[param.key] || []).slice();
          var at = list.indexOf(opt);
          if (cb2.checked && at === -1) list.push(opt);
          if (!cb2.checked && at !== -1) list.splice(at, 1);
          update(param.key, list);
        });
        var lb2 = el('label', null, opt);
        lb2.htmlFor = cb2.id;
        row2.appendChild(cb2);
        row2.appendChild(lb2);
        box.appendChild(row2);
      });
      wrap.appendChild(box);
    } else if (param.type === 'select') {
      var sel = el('select');
      sel.id = id;
      param.options.forEach(function (opt) {
        var o = el('option', null, opt);
        o.value = opt;
        if (opt === value) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () { update(param.key, sel.value); });
      wrap.appendChild(sel);
    } else if (param.type === 'textarea') {
      var ta = el('textarea');
      ta.id = id;
      ta.value = value || '';
      if (param.placeholder) ta.placeholder = param.placeholder;
      ta.addEventListener('input', function () { update(param.key, ta.value); });
      wrap.appendChild(ta);
    } else {
      var inp = el('input');
      inp.type = param.type === 'number' ? 'number' : (param.type === 'url' ? 'url' : (param.type === 'email' ? 'email' : 'text'));
      inp.id = id;
      inp.value = value === undefined || value === null ? '' : value;
      if (param.placeholder) inp.placeholder = param.placeholder;
      inp.addEventListener('input', function () {
        update(param.key, param.type === 'number' ? Number(inp.value) : inp.value);
      });
      wrap.appendChild(inp);
    }

    if (param.help) wrap.appendChild(el('div', 'help', param.help));
    /* Los textarea largos ocupan las dos columnas de la grilla. */
    if (param.type === 'textarea' || param.type === 'multi') wrap.style.gridColumn = '1 / -1';
    return wrap;
  }

  function update(key, value) {
    config[key] = value;
    saveConfig(current.id, config);
    renderPreview();
  }

  function renderPreview() {
    var lines = current.params.map(function (p) {
      var v = config[p.key];
      if (typeof v === 'boolean') v = v ? 'Sí' : 'No';
      else if (Array.isArray(v)) v = v.length ? v.join(', ') : '—';
      else if (v === '' || v === undefined || v === null) v = '—';
      else v = String(v).replace(/\n/g, ' / ');
      return p.label + ': ' + v;
    });
    document.getElementById('modal-preview').textContent = lines.join('\n');
  }

  function openModal(id) {
    current = API.byId(id);
    if (!current) return;

    var saved = loadSaved()[id];
    config = API.defaults(current);
    if (saved) {
      Object.keys(saved).forEach(function (k) {
        if (k in config) config[k] = saved[k];
      });
    }

    document.getElementById('modal-cat').textContent = current.category;
    document.getElementById('modal-title').textContent = current.num + '. ' + current.name;
    document.getElementById('modal-sub').textContent = current.summary;
    renderFlow(document.getElementById('modal-flow'), current);

    var box = document.getElementById('modal-params');
    box.innerHTML = '';
    current.params.forEach(function (p) { box.appendChild(fieldFor(p)); });

    renderPreview();
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* -------------------------------- eventos ------------------------------- */
  document.getElementById('modal-close').addEventListener('click', closeModal);
  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) closeModal();
  });

  document.getElementById('dl-workflow').addEventListener('click', function () {
    var wf = API.buildWorkflow(current, config);
    download('myleads-' + slug(current.name) + '-n8n.json', JSON.stringify(wf, null, 2));
    toast('Blueprint descargado. Importalo en n8n con "Import from File".');
  });

  document.getElementById('dl-spec').addEventListener('click', function () {
    var spec = API.buildSpec(current, config);
    download('myleads-' + slug(current.name) + '-ficha.json', JSON.stringify(spec, null, 2));
    toast('Ficha descargada.');
  });

  document.getElementById('copy-spec').addEventListener('click', function () {
    var text = document.getElementById('modal-preview').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast('Resumen copiado al portapapeles.'); },
        function () { toast('No se pudo copiar. Seleccioná el texto manualmente.'); }
      );
    } else {
      toast('Tu navegador no permite copiar automáticamente.');
    }
  });

  /* --------------------------------- inicio -------------------------------- */
  renderFilters();
  renderCatalog(null);

  /* Permite enlazar directo a una automatización: automatizaciones.html#lead-gen
     Se atiende también el cambio de hash, para los enlaces dentro de la misma página. */
  function openFromHash() {
    var id = location.hash.slice(1);
    if (id && API.byId(id)) openModal(id);
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
})();
