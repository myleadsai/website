/* ==========================================================================
   Myleads.ai — Catálogo de automatizaciones
   Fuente única de verdad: cada automatización describe su flujo, sus
   integraciones y los parámetros que el cliente puede personalizar.
   Consumido por automatizaciones.html (catálogo + configurador).
   ========================================================================== */
(function (global) {
  'use strict';

  /* Tipos de nodo -> equivalencia en n8n para el blueprint exportable. */
  var NODE_TYPES = {
    schedule:  { n8n: 'n8n-nodes-base.scheduleTrigger', v: 1.2 },
    webhook:   { n8n: 'n8n-nodes-base.webhook',         v: 2   },
    form:      { n8n: 'n8n-nodes-base.formTrigger',     v: 2.2 },
    chat:      { n8n: 'n8n-nodes-base.chatTrigger',     v: 1.1 },
    set:       { n8n: 'n8n-nodes-base.set',             v: 3.4 },
    ai:        { n8n: '@n8n/n8n-nodes-langchain.openAi', v: 1.8 },
    agent:     { n8n: '@n8n/n8n-nodes-langchain.agent',  v: 1.9 },
    http:      { n8n: 'n8n-nodes-base.httpRequest',     v: 4.2 },
    filter:    { n8n: 'n8n-nodes-base.filter',          v: 2.2 },
    router:    { n8n: 'n8n-nodes-base.switch',          v: 3.2 },
    gmail:     { n8n: 'n8n-nodes-base.gmail',           v: 2.1 },
    sheets:    { n8n: 'n8n-nodes-base.googleSheets',    v: 4.5 },
    calendar:  { n8n: 'n8n-nodes-base.googleCalendar',  v: 1.3 },
    crm:       { n8n: 'n8n-nodes-base.hubspot',         v: 2.1 },
    wait:      { n8n: 'n8n-nodes-base.wait',            v: 1.1 },
    gmailTrigger:  { n8n: 'n8n-nodes-base.gmailTrigger',       v: 1.2 },
    driveTrigger:  { n8n: 'n8n-nodes-base.googleDriveTrigger', v: 1   }
  };

  /* Catálogo. `params` define TODO lo que el cliente puede personalizar. */
  var AUTOMATIONS = [
    {
      id: 'voice-agent',
      num: 1,
      name: 'Agente de Voz IA',
      tagline: 'Atiende 10 llamadas a la vez, sin límite diario.',
      category: 'Atención y reservas',
      summary: 'Contesta el teléfono con voz natural, responde preguntas, consulta disponibilidad, agenda la cita en tu calendario, confirma por email y crea el contacto en el CRM. Si detecta un caso complejo, transfiere a una persona.',
      useCase: 'En Myleads.ai lo usamos para que ninguna llamada de un prospecto quede sin atender fuera de horario: el agente califica y agenda directo en Calendly/Google Calendar.',
      integrations: ['OpenAI Realtime', 'Twilio / Vapi', 'Google Calendar', 'Gmail', 'HubSpot'],
      nodes: [
        { icon: '📞', label: 'Llamada entrante', sub: 'Webhook', type: 'webhook' },
        { icon: '🧠', label: 'Agente de voz', sub: 'OpenAI Realtime', type: 'agent' },
        { icon: '📋', label: 'Consultar disponibilidad', sub: 'Herramientas', type: 'http' },
        { icon: '📅', label: 'Agendar cita', sub: 'Google Calendar', type: 'calendar' },
        { icon: '✉️', label: 'Enviar confirmación', sub: 'Gmail', type: 'gmail' },
        { icon: '🔀', label: 'Escalar a humano', sub: 'Enrutador', type: 'router' },
        { icon: '👤', label: 'Crear contacto CRM', sub: 'HubSpot', type: 'crm' }
      ],
      params: [
        { key: 'nombreAgente', label: 'Nombre del agente', type: 'text', def: 'Sofía', help: 'Cómo se presenta al contestar.' },
        { key: 'negocio', label: 'Nombre del negocio', type: 'text', def: 'Myleads.ai' },
        { key: 'idioma', label: 'Idioma principal', type: 'select', options: ['Español (neutro)', 'Español (rioplatense)', 'Inglés', 'Portugués', 'Bilingüe ES/EN'], def: 'Español (rioplatense)' },
        { key: 'voz', label: 'Voz', type: 'select', options: ['Femenina cálida', 'Femenina profesional', 'Masculina cálida', 'Masculina profesional'], def: 'Femenina cálida' },
        { key: 'horario', label: 'Horario de atención', type: 'text', def: 'Lun a Vie, 9:00 a 19:00', help: 'Fuera de este horario el agente igual atiende y agenda.' },
        { key: 'duracionCita', label: 'Duración de la cita (min)', type: 'number', def: 30 },
        { key: 'calendario', label: 'Calendario destino', type: 'text', def: 'myleads.ia@gmail.com', placeholder: 'ID o email del calendario' },
        { key: 'escalarSi', label: 'Transferir a un humano cuando…', type: 'textarea', def: 'El cliente pide hablar con una persona, reclama por una compra, o el agente no puede responder tras 2 intentos.' },
        { key: 'preguntasCalificacion', label: 'Preguntas de calificación', type: 'textarea', def: '¿A qué se dedica tu negocio?\n¿Cuál es tu facturación mensual aproximada?\n¿Qué estás intentando resolver?', help: 'Una por línea. Las respuestas se guardan en el CRM.' },
        { key: 'crearCRM', label: 'Crear contacto en el CRM', type: 'toggle', def: true }
      ]
    },
    {
      id: 'lead-gen',
      num: 2,
      name: 'Generación de Leads IA',
      tagline: 'Prospección en frío automática: buscar, enriquecer, calificar, escribir y seguir.',
      category: 'Prospección',
      summary: 'Extrae leads de las fuentes que elijas, los enriquece con datos de empresa y persona, los puntúa contra tu perfil de cliente ideal, escribe un email personalizado para cada uno y gestiona los seguimientos hasta que responden.',
      useCase: 'Es el motor que alimenta nuestra propia Consola de Leads: todo lo que pasa el filtro de calificación entra ahí como lead "Caliente".',
      integrations: ['Apify / Apollo', 'OpenAI', 'Gmail', 'Google Sheets', 'Instantly / Smartlead'],
      nodes: [
        { icon: '🌐', label: 'Extraer leads', sub: 'Apify / Apollo', type: 'http' },
        { icon: '🧠', label: 'Investigar y enriquecer', sub: 'OpenAI', type: 'ai' },
        { icon: '🔽', label: 'Calificar leads', sub: 'Filtro ICP', type: 'filter' },
        { icon: '✉️', label: 'Enviar email', sub: 'Gmail', type: 'gmail' },
        { icon: '🕒', label: 'Seguimientos', sub: 'Programador', type: 'wait' },
        { icon: '📊', label: 'Registrar resultado', sub: 'Google Sheets', type: 'sheets' }
      ],
      params: [
        { key: 'fuente', label: 'Fuente de leads', type: 'select', options: ['Apollo', 'Apify (LinkedIn)', 'Apify (Google Maps)', 'Google Maps API', 'CSV propio'], def: 'Apollo' },
        { key: 'industria', label: 'Industria / nicho objetivo', type: 'text', def: 'Coaches, consultores y agencias', placeholder: 'Ej: clínicas dentales, agencias de marketing' },
        { key: 'paises', label: 'Países', type: 'text', def: 'Argentina, España, México, Colombia', help: 'Separados por coma.' },
        { key: 'cargos', label: 'Cargos a buscar', type: 'text', def: 'Fundador, CEO, Director de Marketing', help: 'Separados por coma.' },
        { key: 'tamanoMin', label: 'Empleados (mínimo)', type: 'number', def: 1 },
        { key: 'tamanoMax', label: 'Empleados (máximo)', type: 'number', def: 50 },
        { key: 'leadsPorDia', label: 'Leads nuevos por día', type: 'number', def: 40, help: 'Recomendado: no superar 50 por buzón para cuidar la entregabilidad.' },
        { key: 'puntajeMinimo', label: 'Puntaje mínimo para contactar', type: 'number', def: 60, help: 'De 0 a 100. Usa la misma escala que la Consola de Leads.' },
        { key: 'tonoEmail', label: 'Tono del email', type: 'select', options: ['Directo y breve', 'Consultivo', 'Cercano e informal', 'Formal'], def: 'Directo y breve' },
        { key: 'propuesta', label: 'Tu propuesta de valor', type: 'textarea', def: 'Ayudamos a expertos a empaquetar su conocimiento y montar un sistema de captación y ventas automatizado.' },
        { key: 'cta', label: 'Llamada a la acción', type: 'text', def: '¿Te viene bien una llamada de 15 minutos esta semana?' },
        { key: 'seguimientos', label: 'Cantidad de seguimientos', type: 'number', def: 3 },
        { key: 'diasEntre', label: 'Días entre seguimientos', type: 'number', def: 3 },
        { key: 'pararSiResponde', label: 'Detener la secuencia si responde', type: 'toggle', def: true }
      ]
    },
    {
      id: 'ugc-spy',
      num: 3,
      name: 'Generador de Anuncios UGC',
      tagline: 'Ingeniería inversa de anuncios virales, reescritos con tu mensaje.',
      category: 'Publicidad y creativos',
      summary: 'Le pasás el enlace de un anuncio que está funcionando. La IA lo desarma (gancho, guion, formato, ritmo), lo reconstruye con el mensaje de tu marca y te devuelve 5 prompts listos para generar el video.',
      useCase: 'Lo usamos para producir creativos de campaña sin depender de un editor: partimos de lo que ya funciona en el nicho y lo adaptamos a nuestra oferta.',
      integrations: ['OpenAI', 'Sora 2 / Veo', 'Apify', 'Google Drive'],
      nodes: [
        { icon: '🔗', label: 'Link del anuncio', sub: 'Formulario', type: 'form' },
        { icon: '🔍', label: 'Analizar anuncio', sub: 'Extraer elementos', type: 'http' },
        { icon: '💡', label: 'Obtener insights', sub: 'Gancho, guion, formato', type: 'ai' },
        { icon: '✨', label: 'Generar prompts', sub: '5 prompts de video', type: 'ai' },
        { icon: '🎬', label: 'Crear UGC', sub: 'Específico de marca', type: 'http' },
        { icon: '📁', label: 'Guardar salida', sub: 'Google Drive', type: 'http' }
      ],
      params: [
        { key: 'marca', label: 'Marca', type: 'text', def: 'Myleads.ai' },
        { key: 'producto', label: 'Producto / oferta a promocionar', type: 'text', def: 'Programa Conocimiento Exitoso' },
        { key: 'publico', label: 'Público objetivo', type: 'textarea', def: 'Expertos, coaches y consultores de habla hispana que quieren escalar su negocio online.' },
        { key: 'plataformas', label: 'Plataformas de origen', type: 'multi', options: ['TikTok', 'Instagram', 'YouTube', 'Facebook Ads Library'], def: ['TikTok', 'Instagram'] },
        { key: 'cantidadPrompts', label: 'Prompts a generar', type: 'number', def: 5 },
        { key: 'duracion', label: 'Duración del video (seg)', type: 'number', def: 20 },
        { key: 'tono', label: 'Tono del creativo', type: 'select', options: ['Testimonial', 'Educativo', 'Humor', 'Problema-Solución', 'Storytelling'], def: 'Problema-Solución' },
        { key: 'motor', label: 'Motor de video', type: 'select', options: ['Sora 2', 'Veo 3', 'Runway', 'Solo prompts (sin generar)'], def: 'Sora 2' },
        { key: 'prohibido', label: 'Qué NO debe decir', type: 'textarea', def: 'Nada de promesas de ingresos garantizados ni cifras sin respaldo.' }
      ]
    },
    {
      id: 'faceless-video',
      num: 4,
      name: 'Videos IA sin Rostro',
      tagline: 'Crea, publica y escala canales de video corto sin aparecer en cámara.',
      category: 'Contenido',
      summary: 'Genera el guion, lo convierte en video con voz en off y material visual, le agrega subtítulos y lo publica solo en TikTok, Instagram y YouTube Shorts, en el horario que definas.',
      useCase: 'Mantiene nuestros canales activos todos los días sin ocupar tiempo del equipo, y cada video lleva un CTA hacia la página.',
      integrations: ['OpenAI', 'ElevenLabs', 'Pexels / stock', 'TikTok', 'Instagram', 'YouTube'],
      nodes: [
        { icon: '📝', label: 'Escribir guion', sub: 'Generador IA', type: 'ai' },
        { icon: '🎥', label: 'Crear video', sub: 'Avatares y archivo', type: 'http' },
        { icon: '🔊', label: 'Voz en off', sub: 'ElevenLabs', type: 'http' },
        { icon: '💬', label: 'Subtítulos', sub: 'Automáticos', type: 'http' },
        { icon: '📤', label: 'Publicar', sub: 'Multicanal', type: 'http' },
        { icon: '📈', label: 'Medir rendimiento', sub: 'Google Sheets', type: 'sheets' }
      ],
      params: [
        { key: 'nicho', label: 'Nicho del canal', type: 'text', def: 'Negocios online y automatización con IA' },
        { key: 'videosPorSemana', label: 'Videos por semana', type: 'number', def: 7 },
        { key: 'horaPublicacion', label: 'Hora de publicación', type: 'text', def: '19:00', help: 'Hora local del negocio.' },
        { key: 'duracion', label: 'Duración objetivo (seg)', type: 'number', def: 45 },
        { key: 'estiloVisual', label: 'Estilo visual', type: 'select', options: ['Material de archivo cinematográfico', 'Animación motion graphics', 'Capturas de pantalla', 'Mixto'], def: 'Mixto' },
        { key: 'voz', label: 'Voz en off', type: 'select', options: ['Femenina cálida', 'Masculina grave', 'Neutra informativa', 'Sin voz (solo texto)'], def: 'Masculina grave' },
        { key: 'canales', label: 'Canales de publicación', type: 'multi', options: ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Facebook Reels', 'LinkedIn'], def: ['TikTok', 'Instagram Reels', 'YouTube Shorts'] },
        { key: 'cta', label: 'CTA al final del video', type: 'text', def: 'Enlace en la biografía para agendar tu llamada gratuita.' },
        { key: 'aprobacion', label: 'Requiere aprobación antes de publicar', type: 'toggle', def: true, help: 'Recomendado al arrancar: revisas el guion antes de que salga.' }
      ]
    },
    {
      id: 'content-agent',
      num: 5,
      name: 'Agente de Creación de Contenido',
      tagline: 'De la idea a la publicación, en todos los canales, en bucle.',
      category: 'Contenido',
      summary: 'Investiga tendencias de tu nicho, genera el guion, produce el video o la pieza, agrega subtítulos y publica en todas tus redes. Después vuelve a empezar, solo.',
      useCase: 'Es nuestro calendario editorial en piloto automático: investiga qué se está buscando en el nicho y produce sobre eso, no sobre corazonadas.',
      integrations: ['OpenAI', 'Google Trends', 'TikTok', 'Instagram', 'YouTube', 'LinkedIn', 'X'],
      nodes: [
        { icon: '🔎', label: 'Investigar temas', sub: 'Tendencias e ideas', type: 'http' },
        { icon: '📝', label: 'Generar guion', sub: 'Redacción IA', type: 'ai' },
        { icon: '🎬', label: 'Crear pieza', sub: 'Imagen / voz / edición', type: 'http' },
        { icon: '💬', label: 'Agregar subtítulos', sub: 'Automáticos', type: 'http' },
        { icon: '📤', label: 'Publicar', sub: 'Todas las plataformas', type: 'http' },
        { icon: '🔁', label: 'Repetir', sub: 'Programado', type: 'schedule' }
      ],
      params: [
        { key: 'temas', label: 'Temas pilares', type: 'textarea', def: 'Captación de clientes\nAutomatización con IA\nOfertas de alto valor\nCasos de alumnos', help: 'Uno por línea. El agente rota entre ellos.' },
        { key: 'frecuencia', label: 'Frecuencia', type: 'select', options: ['Diaria', '3 veces por semana', 'Semanal'], def: 'Diaria' },
        { key: 'formatos', label: 'Formatos', type: 'multi', options: ['Video corto', 'Carrusel', 'Post de texto', 'Newsletter', 'Artículo de blog'], def: ['Video corto', 'Carrusel'] },
        { key: 'canales', label: 'Canales', type: 'multi', options: ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'X', 'Email'], def: ['Instagram', 'TikTok', 'LinkedIn'] },
        { key: 'tono', label: 'Tono de marca', type: 'select', options: ['Cercano y directo', 'Autoridad / experto', 'Inspiracional', 'Técnico'], def: 'Cercano y directo' },
        { key: 'idioma', label: 'Idioma', type: 'select', options: ['Español', 'Inglés', 'Español + Inglés'], def: 'Español' },
        { key: 'aprobacion', label: 'Revisar antes de publicar', type: 'toggle', def: true }
      ]
    },
    {
      id: 'faq-chatbot',
      num: 6,
      name: 'Chatbot FAQ Multilingüe',
      tagline: 'Responde en el idioma del cliente, al instante, en tu web.',
      category: 'Atención y reservas',
      summary: 'Cuando alguien escribe desde tu web o un enlace compartido, detecta su idioma, responde con tu base de conocimiento, gestiona las repreguntas y, si el interés es alto, deriva a agendar una llamada.',
      useCase: 'Va embebido en esta misma página: responde dudas del programa 24/7 y empuja hacia el calendario en vez de dejar la consulta enfriarse.',
      integrations: ['OpenAI', 'Base de conocimiento', 'Calendly', 'Google Sheets'],
      nodes: [
        { icon: '💬', label: 'Mensaje del usuario', sub: 'Web / enlace', type: 'chat' },
        { icon: '🌐', label: 'Detectar idioma', sub: 'Automático', type: 'ai' },
        { icon: '🧠', label: 'Responder', sub: 'Base de conocimiento', type: 'agent' },
        { icon: '📤', label: 'Enviar respuesta', sub: 'En su idioma', type: 'set' },
        { icon: '📅', label: 'Derivar a agenda', sub: 'Calendly', type: 'http' },
        { icon: '📊', label: 'Guardar conversación', sub: 'Google Sheets', type: 'sheets' }
      ],
      params: [
        { key: 'nombreBot', label: 'Nombre del bot', type: 'text', def: 'Asistente Myleads' },
        { key: 'idiomas', label: 'Idiomas soportados', type: 'multi', options: ['Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano', 'Detección automática (+20)'], def: ['Español', 'Inglés', 'Portugués', 'Detección automática (+20)'] },
        { key: 'baseConocimiento', label: 'Base de conocimiento', type: 'textarea', def: 'FAQ de la página, detalle del programa Conocimiento Exitoso, precios, duración, modalidad y política de reembolso.', help: 'Qué puede responder. Todo lo que no esté aquí lo deriva a una persona.' },
        { key: 'tono', label: 'Tono', type: 'select', options: ['Cercano', 'Profesional', 'Comercial'], def: 'Cercano' },
        { key: 'linkAgenda', label: 'Enlace de agenda', type: 'url', def: 'https://calendly.com/myleads-ia/30min' },
        { key: 'capturarEmail', label: 'Pedir email antes de responder', type: 'toggle', def: false, help: 'Sube la captura de leads pero baja la cantidad de conversaciones.' },
        { key: 'derivarHumano', label: 'Derivar a humano si no sabe', type: 'toggle', def: true },
        { key: 'noResponder', label: 'Temas que no debe tratar', type: 'textarea', def: 'Asesoramiento legal, fiscal o médico. Promesas de resultados económicos.' }
      ]
    },
    {
      id: 'youtube-ideas',
      num: 7,
      name: 'Generador de Ideas Virales para YouTube',
      tagline: 'Ideas de contenido respaldadas por datos reales de tu nicho.',
      category: 'Contenido',
      summary: 'Trae los videos con mejor rendimiento de tu nicho, los analiza (títulos, palabras clave, interacción) y te devuelve ideas frescas con títulos, ángulos y palabras clave que tu audiencia ya está buscando.',
      useCase: 'Antes de grabar cualquier cosa, revisamos qué ángulos están traccionando. Menos adivinar, más datos.',
      integrations: ['YouTube Data API', 'OpenAI', 'Google Sheets'],
      nodes: [
        { icon: '▶️', label: 'Traer videos top', sub: 'YouTube API', type: 'http' },
        { icon: '📊', label: 'Analizar contenido', sub: 'Títulos e interacción', type: 'ai' },
        { icon: '🧠', label: 'Generar ideas', sub: 'Con IA', type: 'ai' },
        { icon: '💡', label: 'Entregar ideas', sub: 'Títulos y ángulos', type: 'sheets' }
      ],
      params: [
        { key: 'nicho', label: 'Nicho', type: 'text', def: 'Negocios online, infoproductos y automatización' },
        { key: 'canales', label: 'Canales de referencia', type: 'textarea', def: '', placeholder: 'Un canal o URL por línea (opcional)', help: 'Si lo dejás vacío, busca por nicho.' },
        { key: 'idioma', label: 'Idioma de búsqueda', type: 'select', options: ['Español', 'Inglés', 'Ambos'], def: 'Español' },
        { key: 'periodo', label: 'Periodo a analizar', type: 'select', options: ['Últimos 7 días', 'Últimos 30 días', 'Últimos 90 días'], def: 'Últimos 30 días' },
        { key: 'cantidadIdeas', label: 'Ideas por ejecución', type: 'number', def: 10 },
        { key: 'frecuencia', label: 'Frecuencia', type: 'select', options: ['Diaria', 'Semanal', 'Quincenal'], def: 'Semanal' },
        { key: 'destino', label: 'Dónde recibir las ideas', type: 'select', options: ['Google Sheets', 'Email', 'Notion', 'Slack'], def: 'Google Sheets' }
      ]
    },
    {
      id: 'avatar-generator',
      num: 8,
      name: 'Generador de Avatares IA',
      tagline: 'Videos de presentador realista sin grabar una sola toma.',
      category: 'Contenido',
      summary: 'Escribe el guion, genera un avatar realista hablando a cámara, le agrega la voz y exporta el video listo para publicar. Soporta varios idiomas con el mismo avatar.',
      useCase: 'Nos permite producir versiones del mismo mensaje en varios idiomas y para varios públicos sin volver a grabar.',
      integrations: ['HeyGen', 'OpenAI', 'ElevenLabs', 'Google Drive'],
      nodes: [
        { icon: '📝', label: 'Crear guion', sub: 'Generado por IA', type: 'ai' },
        { icon: '🧍', label: 'Generar avatar', sub: 'HeyGen', type: 'http' },
        { icon: '🎙️', label: 'Voz y edición', sub: 'Voz IA', type: 'http' },
        { icon: '📤', label: 'Exportar video', sub: 'Listo para publicar', type: 'http' }
      ],
      params: [
        { key: 'avatar', label: 'Avatar', type: 'select', options: ['Avatar prediseñado (masculino)', 'Avatar prediseñado (femenino)', 'Avatar propio (clonado)'], def: 'Avatar propio (clonado)' },
        { key: 'idiomas', label: 'Idiomas a generar', type: 'multi', options: ['Español', 'Inglés', 'Portugués', 'Francés', 'Italiano'], def: ['Español'] },
        { key: 'duracion', label: 'Duración objetivo (seg)', type: 'number', def: 60 },
        { key: 'formato', label: 'Formato', type: 'select', options: ['Vertical 9:16', 'Horizontal 16:9', 'Cuadrado 1:1', 'Los tres'], def: 'Vertical 9:16' },
        { key: 'fondo', label: 'Fondo', type: 'select', options: ['Oficina', 'Neutro', 'Color de marca', 'Transparente'], def: 'Color de marca' },
        { key: 'guionBase', label: 'Instrucciones para el guion', type: 'textarea', def: 'Abrir con un problema concreto del espectador, dar una idea accionable y cerrar invitando a agendar una llamada.' },
        { key: 'subtitulos', label: 'Incluir subtítulos quemados', type: 'toggle', def: true }
      ]
    },
    {
      id: 'lead-scraper',
      num: 9,
      name: 'Captador de Leads 24/7',
      tagline: 'Busca leads mientras dormís.',
      category: 'Prospección',
      summary: 'La versión mínima y robusta del motor de prospección: se dispara solo cada día, busca leads frescos, completa los campos que faltan y manda el primer email. Te despertás con respuestas, no con una lista de tareas.',
      useCase: 'Corre todos los días a primera hora y deja los leads calificados esperando en la Consola de Leads.',
      integrations: ['Apollo', 'Instantly / Smartlead', 'Gmail', 'Google Sheets'],
      nodes: [
        { icon: '🕒', label: 'Programador', sub: 'Disparador', type: 'schedule' },
        { icon: '🌐', label: 'Buscar leads', sub: 'Apollo', type: 'http' },
        { icon: '⚙️', label: 'Enriquecer', sub: 'Completar campos', type: 'set' },
        { icon: '✉️', label: 'Enviar outreach', sub: 'Gmail', type: 'gmail' }
      ],
      params: [
        { key: 'hora', label: 'Hora de ejecución diaria', type: 'text', def: '07:00' },
        { key: 'proveedor', label: 'Proveedor de datos', type: 'select', options: ['Apollo', 'Instantly', 'Smartlead', 'Apify'], def: 'Apollo' },
        { key: 'busqueda', label: 'Criterio de búsqueda', type: 'textarea', def: 'Fundadores y consultores de habla hispana, empresas de 1 a 20 empleados, con web activa y presencia en redes.' },
        { key: 'cantidad', label: 'Leads por ejecución', type: 'number', def: 25 },
        { key: 'buzon', label: 'Buzón de envío', type: 'email', def: 'myleads.ia@gmail.com' },
        { key: 'asunto', label: 'Asunto del email', type: 'text', def: 'Una idea para {{empresa}}' },
        { key: 'cuerpo', label: 'Cuerpo del email', type: 'textarea', def: 'Hola {{nombre}},\n\nVi lo que están haciendo en {{empresa}} y se me ocurrió una forma de que capten clientes sin depender de referidos.\n\n¿Te viene bien una llamada de 15 minutos esta semana?\n\nFranco — Myleads.ai', help: 'Variables disponibles: {{nombre}}, {{empresa}}, {{cargo}}, {{web}}.' },
        { key: 'soloVerificados', label: 'Enviar solo a emails verificados', type: 'toggle', def: true, help: 'Muy recomendado: protege la reputación de tu dominio.' },
        { key: 'sincronizarConsola', label: 'Volcar resultados a la Consola de Leads', type: 'toggle', def: true }
      ]
    },
    {
      id: 'repurposer',
      num: 10,
      name: 'Reciclador de Contenido',
      tagline: 'Un video se convierte en veinte publicaciones.',
      category: 'Contenido',
      summary: 'Subís un video largo y él solo lo corta en clips, transcribe, escribe los textos, arma los carruseles y los hilos, y los deja programados. Una grabación, semanas de contenido.',
      useCase: 'Cada consultoría grupal o webinar que grabamos alimenta el calendario de las dos semanas siguientes sin que nadie edite nada a mano.',
      integrations: ['Google Drive', 'Deepgram', 'OpenAI', 'Buffer / Metricool'],
      nodes: [
        { icon: '📹', label: 'Video nuevo', sub: 'Google Drive', type: 'driveTrigger' },
        { icon: '🎧', label: 'Transcribir', sub: 'Deepgram', type: 'http' },
        { icon: '✂️', label: 'Clips y textos', sub: 'OpenAI', type: 'ai' },
        { icon: '📚', label: 'Armar piezas', sub: 'Carruseles e hilos', type: 'ai' },
        { icon: '📤', label: 'Programar', sub: 'Buffer', type: 'http' }
      ],
      params: [
        { key: 'carpeta', label: 'Carpeta de Drive a vigilar', type: 'text', def: 'Grabaciones / Consultorías', help: 'Cuando aparece un video nuevo ahí, arranca solo.' },
        { key: 'clipsPorVideo', label: 'Clips por video', type: 'number', def: 8 },
        { key: 'duracionClip', label: 'Duración de cada clip', type: 'select', options: ['15 a 30 segundos', '30 a 60 segundos', '60 a 90 segundos'], def: '30 a 60 segundos' },
        { key: 'piezas', label: 'Piezas a generar', type: 'multi', options: ['Clips verticales', 'Carrusel', 'Hilo para X', 'Publicación en LinkedIn', 'Newsletter', 'Artículo de blog'], def: ['Clips verticales', 'Carrusel', 'Publicación en LinkedIn'] },
        { key: 'canales', label: 'Dónde publicar', type: 'multi', options: ['Instagram', 'TikTok', 'YouTube Shorts', 'LinkedIn', 'X', 'Facebook'], def: ['Instagram', 'TikTok', 'LinkedIn'] },
        { key: 'idioma', label: 'Idioma de la transcripción', type: 'select', options: ['Español', 'Inglés', 'Portugués', 'Detección automática'], def: 'Español' },
        { key: 'tono', label: 'Tono de los textos', type: 'select', options: ['Cercano y directo', 'Autoridad / experto', 'Provocador', 'Formal'], def: 'Cercano y directo' },
        { key: 'criterioClip', label: 'Qué momentos priorizar', type: 'textarea', def: 'Frases con una idea completa y autosuficiente, respuestas a objeciones y momentos con dato o cifra concreta.', help: 'Así elige qué cortar y qué descartar.' },
        { key: 'programador', label: 'Herramienta de publicación', type: 'select', options: ['Buffer', 'Metricool', 'Publicación directa por API', 'Solo dejar borradores'], def: 'Buffer' },
        { key: 'subtitulos', label: 'Subtítulos quemados en los clips', type: 'toggle', def: true },
        { key: 'aprobacion', label: 'Revisar antes de programar', type: 'toggle', def: true },
        { key: 'cta', label: 'CTA al cierre', type: 'text', def: 'Enlace en la biografía para agendar tu llamada gratuita.' }
      ]
    },
    {
      id: 'facturas',
      num: 11,
      name: 'Piloto Automático de Facturas',
      tagline: 'Lee, registra y controla tus facturas por vos.',
      category: 'Operaciones',
      summary: 'Lee cada factura que llega por email o en PDF, saca los números, los carga en tu planilla y avisa de todo lo que está por vencer o ya venció. La administración que nadie quiere hacer, resuelta.',
      useCase: 'Nos saca de encima la carga manual de facturas y nos avisa de los vencimientos antes de que se transformen en un problema.',
      integrations: ['Gmail', 'OpenAI', 'Google Sheets', 'QuickBooks'],
      nodes: [
        { icon: '📨', label: 'Factura nueva', sub: 'Gmail', type: 'gmailTrigger' },
        { icon: '🔍', label: 'Extraer campos', sub: 'Leer la factura', type: 'ai' },
        { icon: '📊', label: 'Registrar fila', sub: 'Google Sheets', type: 'sheets' },
        { icon: '⏰', label: '¿Vencida?', sub: 'Filtro', type: 'filter' },
        { icon: '🔔', label: 'Enviar alerta', sub: 'Gmail', type: 'gmail' }
      ],
      params: [
        { key: 'buzon', label: 'Buzón a vigilar', type: 'email', def: 'myleads.ia@gmail.com' },
        { key: 'etiqueta', label: 'Etiqueta o carpeta', type: 'text', def: 'Facturas', help: 'Solo mira los emails con esta etiqueta. Dejalo vacío para mirar todo el buzón.' },
        { key: 'origen', label: 'De dónde leer', type: 'multi', options: ['Adjuntos PDF', 'Cuerpo del email', 'Carpeta de Google Drive'], def: ['Adjuntos PDF', 'Cuerpo del email'] },
        { key: 'campos', label: 'Campos a extraer', type: 'textarea', def: 'Proveedor\nNúmero de factura\nFecha de emisión\nFecha de vencimiento\nSubtotal\nImpuestos\nTotal\nMoneda', help: 'Uno por línea. Se convierten en columnas de la planilla.' },
        { key: 'destino', label: 'Dónde registrarlas', type: 'select', options: ['Google Sheets', 'Notion', 'QuickBooks', 'Airtable'], def: 'Google Sheets' },
        { key: 'hoja', label: 'Nombre de la planilla u hoja', type: 'text', def: 'Facturas 2026' },
        { key: 'moneda', label: 'Moneda por defecto', type: 'select', options: ['ARS', 'USD', 'EUR', 'MXN', 'COP'], def: 'USD', help: 'Se usa solo cuando la factura no la aclara.' },
        { key: 'avisarAntes', label: 'Avisar cuántos días antes del vencimiento', type: 'number', def: 3 },
        { key: 'alertaA', label: 'A quién avisar', type: 'email', def: 'myleads.ia@gmail.com' },
        { key: 'resumen', label: 'Resumen periódico', type: 'select', options: ['Diario', 'Semanal', 'Mensual', 'Solo alertas de vencimiento'], def: 'Semanal' },
        { key: 'revisarDudosas', label: 'Marcar para revisión si no puede leer un campo', type: 'toggle', def: true, help: 'Muy recomendado: evita que se registre un importe equivocado sin que nadie lo note.' }
      ]
    },
    {
      id: 'resenas',
      num: 12,
      name: 'Respuesta a Reseñas',
      tagline: 'Contesta las reseñas con la voz de tu marca.',
      category: 'Reputación',
      summary: 'Cuando entra una reseña nueva, redacta la respuesta en el tono de tu marca antes de que la veas. Vos aprobás, o la dejás publicar sola. Reputación que se mantiene sin vos.',
      useCase: 'Ninguna reseña se queda sin responder, y las negativas nos llegan al instante en vez de descubrirlas una semana después.',
      integrations: ['Google Business', 'Trustpilot', 'OpenAI', 'Gmail'],
      nodes: [
        { icon: '⭐', label: 'Reseña nueva', sub: 'Webhook', type: 'webhook' },
        { icon: '✍️', label: 'Redactar respuesta', sub: 'OpenAI', type: 'ai' },
        { icon: '✅', label: '¿Aprobar?', sub: 'Filtro', type: 'filter' },
        { icon: '📢', label: 'Publicar respuesta', sub: 'Petición HTTP', type: 'http' }
      ],
      params: [
        { key: 'fuentes', label: 'Dónde vigilar reseñas', type: 'multi', options: ['Google Business', 'Trustpilot', 'Facebook', 'Instagram', 'TripAdvisor', 'App Store / Play Store'], def: ['Google Business', 'Trustpilot'] },
        { key: 'vozMarca', label: 'Voz de la marca', type: 'textarea', def: 'Cercana y agradecida, tuteando. Sin sonar a plantilla: siempre menciona algo concreto de lo que dijo la persona.' },
        { key: 'idioma', label: 'Idioma de la respuesta', type: 'select', options: ['El mismo idioma de la reseña', 'Siempre español', 'Siempre inglés'], def: 'El mismo idioma de la reseña' },
        { key: 'publicacion', label: 'Cuándo publicar', type: 'select', options: ['Aprobar siempre antes de publicar', 'Publicar solas las positivas, aprobar las negativas', 'Publicar todas automáticamente'], def: 'Publicar solas las positivas, aprobar las negativas', help: 'Lo más seguro es dejar que una persona mire siempre las negativas.' },
        { key: 'umbralEscalada', label: 'Escalar si la reseña tiene esta cantidad de estrellas o menos', type: 'number', def: 3 },
        { key: 'notificarA', label: 'A quién notificar una reseña negativa', type: 'email', def: 'myleads.ia@gmail.com' },
        { key: 'longitud', label: 'Largo de la respuesta', type: 'select', options: ['Breve (1 o 2 frases)', 'Media (un párrafo)', 'Detallada'], def: 'Breve (1 o 2 frases)' },
        { key: 'firma', label: 'Firma', type: 'text', def: 'El equipo de Myleads.ai' },
        { key: 'prohibido', label: 'Qué nunca debe decir', type: 'textarea', def: 'No admitir responsabilidad legal, no prometer reembolsos ni compensaciones, no discutir con el cliente y no dar datos personales de nadie.' }
      ]
    },
    {
      id: 'tickets',
      num: 13,
      name: 'Clasificador de Tickets',
      tagline: 'Clasifica y enruta cada consulta de soporte.',
      category: 'Atención y reservas',
      summary: 'Cada consulta que entra se clasifica, se etiqueta y se manda a quien corresponde. Las fáciles las contesta solo. El soporte escala sin que crezca el equipo.',
      useCase: 'Las preguntas repetidas sobre precios, acceso y facturación se responden solas, y al equipo solo le llega lo que de verdad necesita una persona.',
      integrations: ['Gmail', 'OpenAI', 'Google Sheets', 'Slack'],
      nodes: [
        { icon: '🎫', label: 'Ticket nuevo', sub: 'Gmail', type: 'gmailTrigger' },
        { icon: '🏷️', label: 'Clasificar', sub: 'OpenAI', type: 'ai' },
        { icon: '🔀', label: 'Enrutar', sub: 'Enrutador', type: 'router' },
        { icon: '↩️', label: 'Responder', sub: 'Gmail', type: 'gmail' },
        { icon: '📊', label: 'Registrar', sub: 'Google Sheets', type: 'sheets' }
      ],
      params: [
        { key: 'buzon', label: 'Buzón de soporte', type: 'email', def: 'myleads.ia@gmail.com' },
        { key: 'canales', label: 'Canales de entrada', type: 'multi', options: ['Email', 'Formulario web', 'WhatsApp', 'Instagram DM', 'Chat del sitio'], def: ['Email', 'Formulario web'] },
        { key: 'categorias', label: 'Categorías', type: 'textarea', def: 'Acceso y contraseñas\nFacturación y pagos\nContenido del programa\nSoporte técnico\nBaja o reembolso\nOtro', help: 'Una por línea. Son las etiquetas con las que clasifica.' },
        { key: 'autoResponde', label: 'Qué categorías responde solo', type: 'textarea', def: 'Acceso y contraseñas\nContenido del programa', help: 'El resto se deriva a una persona. Dejá acá solo lo que tenga una respuesta clara y siempre igual.' },
        { key: 'baseConocimiento', label: 'Base de conocimiento', type: 'textarea', def: 'FAQ del sitio, detalle del programa, precios, formas de pago, cómo acceder a la plataforma y política de reembolso.' },
        { key: 'escalarA', label: 'A quién derivar lo que no resuelve', type: 'text', def: 'Equipo de soporte — Slack #soporte' },
        { key: 'sla', label: 'Avisar si un ticket lleva sin respuesta (horas)', type: 'number', def: 24 },
        { key: 'idioma', label: 'Idioma de la respuesta', type: 'select', options: ['El mismo idioma del ticket', 'Siempre español', 'Siempre inglés'], def: 'El mismo idioma del ticket' },
        { key: 'firma', label: 'Firma de las respuestas', type: 'text', def: 'Equipo de Myleads.ai' },
        { key: 'urgenteSi', label: 'Marcar como urgente cuando…', type: 'textarea', def: 'El cliente pide la baja, menciona un cobro incorrecto o amenaza con un reclamo.' },
        { key: 'aprobacion', label: 'Revisar las respuestas automáticas antes de enviarlas', type: 'toggle', def: false, help: 'Activalo las primeras semanas hasta que confíes en las respuestas.' }
      ]
    }
  ];

  /* ------------------------------------------------------------------
     Construcción del blueprint exportable (formato n8n).
     El nodo "Configuración" lleva todos los valores elegidos, así el
     flujo importado queda personalizado y es legible de un vistazo.
     ------------------------------------------------------------------ */
  function buildWorkflow(automation, config) {
    var nodes = [];
    var connections = {};
    var x = 0;

    var configNode = {
      parameters: {
        assignments: {
          assignments: Object.keys(config).map(function (k, i) {
            var v = config[k];
            return {
              id: 'cfg-' + i,
              name: k,
              value: Array.isArray(v) ? v.join(', ') : v,
              type: typeof v === 'number' ? 'number' : (typeof v === 'boolean' ? 'boolean' : 'string')
            };
          })
        },
        options: {}
      },
      id: 'node-config',
      name: 'Configuración',
      type: NODE_TYPES.set.n8n,
      typeVersion: NODE_TYPES.set.v,
      position: [x, 0],
      notes: 'Parámetros personalizados de ' + automation.name + '. Editá acá para cambiar el comportamiento del flujo.'
    };
    nodes.push(configNode);
    x += 220;

    automation.nodes.forEach(function (n, i) {
      var t = NODE_TYPES[n.type] || NODE_TYPES.http;
      nodes.push({
        parameters: {},
        id: 'node-' + i,
        name: n.label,
        type: t.n8n,
        typeVersion: t.v,
        position: [x, 0],
        notes: n.sub
      });
      x += 220;
    });

    var chain = nodes;
    chain.forEach(function (n, i) {
      if (i < chain.length - 1) {
        connections[n.name] = { main: [[{ node: chain[i + 1].name, type: 'main', index: 0 }]] };
      }
    });

    return {
      name: 'Myleads.ai — ' + automation.name,
      nodes: nodes,
      connections: connections,
      settings: { executionOrder: 'v1' },
      meta: {
        generadoPor: 'Myleads.ai — Catálogo de Automatizaciones',
        automatizacion: automation.id,
        integraciones: automation.integrations,
        generadoEl: new Date().toISOString()
      },
      tags: [{ name: automation.category }]
    };
  }

  /* Ficha legible para el equipo o el cliente (no es un blueprint técnico). */
  function buildSpec(automation, config) {
    return {
      automatizacion: automation.name,
      id: automation.id,
      categoria: automation.category,
      queHace: automation.summary,
      flujo: automation.nodes.map(function (n, i) { return (i + 1) + '. ' + n.label + ' (' + n.sub + ')'; }),
      integraciones: automation.integrations,
      configuracion: config,
      generadoEl: new Date().toISOString()
    };
  }

  global.MyleadsAutomations = {
    list: AUTOMATIONS,
    byId: function (id) {
      return AUTOMATIONS.filter(function (a) { return a.id === id; })[0] || null;
    },
    defaults: function (automation) {
      var cfg = {};
      automation.params.forEach(function (p) {
        cfg[p.key] = Array.isArray(p.def) ? p.def.slice() : p.def;
      });
      return cfg;
    },
    buildWorkflow: buildWorkflow,
    buildSpec: buildSpec
  };
})(window);
