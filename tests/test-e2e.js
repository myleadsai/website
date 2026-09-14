/* Playwright puede estar instalado local o globalmente; se acepta cualquiera. */
function cargarPlaywright() {
  try { return require('playwright'); } catch (e) { /* probamos global */ }
  try {
    const { execSync } = require('child_process');
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(require('path').join(root, 'playwright'));
  } catch (e) {
    console.error('Falta Playwright. Instalalo con: npm install -D playwright');
    process.exit(1);
  }
}
const { chromium } = cargarPlaywright();
const BASE = 'http://127.0.0.1:8099';
const OUT = require('path').join(require('os').tmpdir(), 'myleads-shots');
let fails = 0;
const ok = (n, c, x) => { console.log(c ? '  ✓ ' + n : '  ✗ ' + n + (x !== undefined ? ' → ' + JSON.stringify(x) : '')); if (!c) fails++; };

require('fs').mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  ctx.on('weberror', e => errors.push(String(e.error())));

  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  // ---------- index ----------
  console.log('— index.html —');
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  ok('barra de navegación presente', await page.locator('nav.site-nav').count() === 1);
  ok('sección de automatizaciones presente', await page.locator('#automatizaciones').count() === 1);
  ok('9 tarjetas de automatización', await page.locator('#automatizaciones .service-card').count() === 9, await page.locator('#automatizaciones .service-card').count());
  ok('link al catálogo', await page.locator('a[href="automatizaciones.html"]').count() >= 1);
  ok('link a la consola', await page.locator('a[href="leads.html"]').count() >= 1);
  ok('acordeón FAQ sigue funcionando', await (async () => {
    await page.locator('.faq-question').first().click();
    await page.waitForTimeout(150);
    return await page.locator('.faq-answer').first().isVisible();
  })());
  await page.screenshot({ path: OUT + '/index-full.png', fullPage: true });

  // ---------- catálogo ----------
  console.log('— automatizaciones.html —');
  await page.goto(BASE + '/automatizaciones.html', { waitUntil: 'networkidle' });
  ok('9 tarjetas en el catálogo', await page.locator('.auto-card').count() === 9, await page.locator('.auto-card').count());
  ok('filtros por categoría', await page.locator('.filter-btn').count() >= 4, await page.locator('.filter-btn').count());
  await page.locator('.filter-btn', { hasText: 'Prospección' }).click();
  await page.waitForTimeout(200);
  ok('filtro Prospección muestra 2', await page.locator('.auto-card').count() === 2, await page.locator('.auto-card').count());
  await page.locator('.filter-btn').first().click();
  await page.waitForTimeout(200);
  ok('volver a Todas muestra 9', await page.locator('.auto-card').count() === 9);
  await page.screenshot({ path: OUT + '/catalogo.png', fullPage: true });

  // abrir configurador
  await page.locator('.auto-card').nth(1).locator('button', { hasText: 'Configurar' }).click();
  await page.waitForTimeout(300);
  ok('modal abierto', await page.locator('#modal-backdrop.open').count() === 1);
  ok('título correcto', (await page.locator('#modal-title').textContent()).includes('Generación de Leads'), await page.locator('#modal-title').textContent());
  ok('campos renderizados', await page.locator('#modal-params .field').count() === 14, await page.locator('#modal-params .field').count());
  const prev0 = await page.locator('#modal-preview').textContent();
  ok('resumen inicial no vacío', prev0.length > 100);

  // cambiar un valor y ver que el resumen se actualiza
  await page.fill('#p-industria', 'Clínicas dentales');
  await page.waitForTimeout(200);
  const prev1 = await page.locator('#modal-preview').textContent();
  ok('el resumen refleja el cambio', prev1.includes('Clínicas dentales'), prev1.slice(0, 120));
  await page.screenshot({ path: OUT + '/configurador.png' });

  // descargar blueprint
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#dl-workflow').click()
  ]);
  const path = await dl.path();
  const wf = JSON.parse(require('fs').readFileSync(path, 'utf8'));
  ok('blueprint es JSON válido', !!wf.nodes);
  ok('blueprint tiene nodo de configuración', wf.nodes[0].name === 'Configuración');
  ok('blueprint lleva el valor personalizado',
     JSON.stringify(wf.nodes[0].parameters).includes('Clínicas dentales'));
  ok('blueprint tiene conexiones', Object.keys(wf.connections).length === wf.nodes.length - 1, Object.keys(wf.connections).length);

  // persistencia: recargar y reabrir
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.auto-card').nth(1).locator('button', { hasText: 'Configurar' }).click();
  await page.waitForTimeout(300);
  ok('la configuración persiste tras recargar', await page.inputValue('#p-industria') === 'Clínicas dentales', await page.inputValue('#p-industria'));
  await page.keyboard.press('Escape');

  // enlace directo por hash
  await page.goto(BASE + '/automatizaciones.html#faq-chatbot', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  ok('el hash abre la automatización', (await page.locator('#modal-title').textContent()).includes('Chatbot'), await page.locator('#modal-title').textContent());

  // ---------- consola de leads ----------
  console.log('— leads.html —');
  await page.goto(BASE + '/leads.html', { waitUntil: 'networkidle' });
  ok('panel de pesos renderizado', await page.locator('#weights .weight-row').count() === 7, await page.locator('#weights .weight-row').count());
  ok('estado vacío visible', await page.locator('#empty-state').isVisible());

  await page.locator('#demo-btn').click();
  await page.waitForTimeout(300);
  ok('6 leads de ejemplo cargados', await page.locator('#leads-body tr').count() === 6, await page.locator('#leads-body tr').count());
  ok('estado vacío oculto', !(await page.locator('#empty-state').isVisible()));

  const stats = await page.locator('.stat strong').allTextContents();
  ok('estadísticas calculadas', stats[0] === '6', stats);
  ok('hay al menos un caliente', Number(stats[1]) >= 1, stats);

  // ordenado por puntaje descendente
  const scores = (await page.locator('.score-num').allTextContents()).map(Number);
  ok('ordenado por puntaje desc', scores.every((v, i) => i === 0 || scores[i - 1] >= v), scores);
  ok('el descalificado va a 0', scores[scores.length - 1] === 0, scores);

  // filtro por temperatura
  await page.selectOption('#filter-temp', 'Caliente');
  await page.waitForTimeout(200);
  const calientes = await page.locator('#leads-body tr').count();
  ok('filtro Caliente reduce la lista', calientes > 0 && calientes < 6, calientes);
  await page.selectOption('#filter-temp', '');
  await page.waitForTimeout(200);

  // buscador
  await page.fill('#search', 'martin');
  await page.waitForTimeout(250);
  ok('buscador ignora acentos', await page.locator('#leads-body tr').count() === 1, await page.locator('#leads-body tr').count());
  await page.fill('#search', '');
  await page.waitForTimeout(200);

  // mover un peso cambia los puntajes
  const before = (await page.locator('.score-num').allTextContents()).join(',');
  await page.locator('#w-pais').fill('0');
  await page.dispatchEvent('#w-pais', 'input');
  await page.waitForTimeout(250);
  const after = (await page.locator('.score-num').allTextContents()).join(',');
  ok('cambiar un peso recalcula', before !== after, { before, after });

  // detalle + email
  await page.locator('#leads-body tr').first().locator('button', { hasText: 'Ver' }).click();
  await page.waitForTimeout(300);
  ok('modal de detalle abierto', await page.locator('#detail-modal.open').count() === 1);
  const draft = await page.inputValue('#detail-draft');
  ok('borrador de email generado', draft.includes('Asunto:') && draft.includes('calendly'), draft.slice(0, 60));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // cambiar estado persiste
  await page.locator('#leads-body tr').first().locator('select').selectOption('Contactado');
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  ok('leads persisten tras recargar', await page.locator('#leads-body tr').count() === 6, await page.locator('#leads-body tr').count());
  const contactados = (await page.locator('.stat strong').allTextContents())[3];
  ok('el estado persiste', contactados === '1', contactados);

  // alta manual
  await page.locator('#add-lead').click();
  await page.waitForTimeout(200);
  await page.fill('#f-nombre', 'Test Prueba');
  await page.fill('#f-empresa', 'Agencia Test');
  await page.fill('#f-cargo', 'Fundador');
  await page.fill('#f-email', 'test@agencia.com');
  await page.fill('#f-pais', 'Argentina');
  await page.fill('#f-empleados', '10');
  await page.check('#f-verificado');
  await page.locator('#lead-save').click();
  await page.waitForTimeout(300);
  ok('lead agregado a mano', await page.locator('#leads-body tr').count() === 7, await page.locator('#leads-body tr').count());

  // exportar CSV
  const [dl2] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#export-btn').click()
  ]);
  const csv = require('fs').readFileSync(await dl2.path(), 'utf8');
  ok('CSV exportado con encabezados', csv.split('\n')[0].includes('puntaje'), csv.split('\n')[0]);
  ok('CSV con 7 filas de datos', csv.trim().split('\n').length === 8, csv.trim().split('\n').length);

  await page.screenshot({ path: OUT + '/leads.png', fullPage: true });

  // móvil
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  for (const p of ['index.html', 'automatizaciones.html', 'leads.html']) {
    await mobile.goto(BASE + '/' + p, { waitUntil: 'networkidle' });
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok('sin scroll horizontal en móvil: ' + p, overflow <= 1, overflow);
    await mobile.screenshot({ path: OUT + '/mobile-' + p.replace('.html', '') + '.png', fullPage: p !== 'index.html' });
  }

  const real = errors.filter(e => !/ERR_CERT_AUTHORITY_INVALID/.test(e));
  console.log('\nErrores de consola/JS (descartando fallos de CDN del sandbox): ' + real.length);
  real.forEach(e => console.log('   ! ' + e));
  if (real.length) fails += real.length;

  await browser.close();
  console.log(fails ? '\nFALLARON ' + fails : '\nTodo OK');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('ERROR FATAL:', e); process.exit(1); });
