/* ==========================================================================
   Churry's · catálogo compartido
   Fuente única de datos para churrys.html y producto.html.
   Tocá SOLO este archivo para cambiar precios, nombres o fotos.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------- configuración general ---------------------------------- */
  var CONFIG = {
    logo:      'logo churrys transparente.png',
    instagram: 'https://www.instagram.com/churrys_ar/',

    /* Link corto de WhatsApp. Se usa de respaldo: wa.link NO admite
       mensaje prearmado, así que solo sirve para abrir el chat vacío. */
    waLink:  'https://wa.link/0j4776',

    /* Número detrás de ese wa.link, con código de país y sin símbolos.
       Es el que permite que el pedido llegue ya escrito al chat.
       Si lo vaciás, se vuelve al waLink y el pedido se copia al portapapeles. */
    waPhone: '542664504414',

    /* Extensiones que se prueban, en orden, al buscar la foto */
    exts: ['png', 'jpg', 'jpeg', 'webp']
  };

  /* ---------- agregados -----------------------------------------------
     capa  = id de la capa que suma al despiece (si no tiene, no se dibuja)
     dips  = pide elegir sabor por cada unidad                             */
  var TOPPINGS = [
    { id: 'medallon', name: 'Medallón 120gr', capa: 'medallon', escalonado: true,
      note: 'En una simple el primero sale $1.500; de ahí en más, $4.000.' },
    { id: 'cheddar', name: 'Cheddar feta', price: 500, capa: 'cheddar',
      note: 'Una feta más, fundida sobre el medallón.' },
    { id: 'panceta', name: 'Panceta', price: 1500, capa: 'panceta',
      note: 'Ahumada, dorada en la plancha.' },
    { id: 'papas', name: 'Porción extra de papas', price: 2500,
      note: 'Además de las que ya vienen con la hamburguesa.' },
    { id: 'cebolla-crispy', name: 'Cebolla Crispy', price: 1000, capa: 'cebolla-crispy',
      note: 'Tiras finas rebozadas y fritas al momento.' },
    { id: 'cebolla-caramelizada', name: 'Cebolla Caramelizada', price: 1000, capa: 'cebolla-caramelizada',
      note: 'Cocida lento hasta que se pone dulce.' },
    { id: 'dip', name: 'Dip de salsa', price: 500, dips: true,
      note: 'Elegís el sabor de cada dip.' }
  ];

  /* sabores disponibles para el dip */
  var DIPS = [
    { id: 'tasty',    name: 'Tasty' },
    { id: 'churry',   name: 'Churry' },
    { id: 'honey',    name: 'Honey' },
    { id: 'alioli',   name: 'Alioli Negro' },
    { id: 'barbacoa', name: 'Barbacoa' },
    { id: 'mayonesa', name: 'Mayonesa' },
    { id: 'ketchup',  name: 'Ketchup' }
  ];

  /* ---------- precio del medallón extra --------------------------------
     En una SIMPLE el primero es el diferencial contra la doble.
     En una DOBLE, y del segundo en adelante, vale el precio pleno.      */
  var MEDALLON_DIFERENCIAL = 1500;
  var MEDALLON_PLENO       = 4000;

  function precioMedallones(n, size) {
    if (!n || n <= 0) return 0;
    if (size === 'doble') return n * MEDALLON_PLENO;
    return MEDALLON_DIFERENCIAL + (n - 1) * MEDALLON_PLENO;
  }

  /* Subtotal de un agregado segun cuantas unidades y el tamaño elegido */
  function precioTopping(t, n, size) {
    if (!t || !n || n <= 0) return 0;
    if (t.escalonado) return precioMedallones(n, size);
    return t.price * n;
  }

  /* ---------- entrega ---------------------------------------------------
     Los textos salen en el modal del checkout y en el mensaje del pedido. */
  var ENTREGA = [
    { id: 'retiro', name: 'Retiro por el local',
      resumen: 'Lo pasás a buscar vos.',
      titulo: 'Te esperamos en el local',
      texto: 'Carlos Alric 732, Merlo, San Luis.\n\n' +
             'Abrimos de lunes a sábados de 20:00 a 00:00 hs. ' +
             'Cuando tengamos tu pedido listo te avisamos por WhatsApp y lo pasás a retirar.',
      mapa: 'https://www.google.com/maps/search/?api=1&query=Carlos%20Alric%20732%2C%20Merlo%2C%20San%20Luis' },

    { id: 'delivery', name: 'Delivery',
      resumen: 'Te lo llevamos.',
      titulo: 'El envío se cotiza aparte',
      texto: 'El costo del envío varía según la distancia, así que no está incluido en este total.\n\n' +
             'Mandanos tu ubicación exacta por WhatsApp junto con el pedido y te confirmamos ' +
             'cuánto sale el envío y en cuánto tiempo llega.',
      mapa: '' }
  ];

  /* Todas las hamburguesas vienen con papas. Se muestra en la carta y en
     la pantalla de personalización.                                        */
  var INCLUYE = 'Incluye guarnición de papas fritas';

  /* ---------- formas de pago -----------------------------------------
     Si sumás el alias/CBU en 'detalle', se incluye en el mensaje.        */
  var PAGOS = [
    { id: 'efectivo',      name: 'Efectivo',      note: 'Abonás al retirar o al recibir el pedido.', detalle: '' },
    { id: 'transferencia', name: 'Transferencia', note: 'Te pasamos los datos por el chat.',         detalle: '' }
  ];

  /* ---------- capas del despiece --------------------------------------
     th  = grosor visible cuando la hamburguesa esta armada
     dim = medidas en el sistema de coordenadas comun (ancho 1000)   */
  var CAPAS = {
    'pan-base':             { name: 'Pan base',                  th: 999, dim: [ 800.0, 285.9] },
    'medallon':             { name: 'Medallón de carne 120gr',   th: 134, dim: [ 800.0, 224.0] },
    'cheddar':              { name: 'Cheddar',                   th: 105, dim: [ 800.0, 210.0] },
    'provolone':            { name: 'Provolone',                 th: 123, dim: [ 800.0, 246.6] },
    'panceta':              { name: 'Panceta',                   th: 124, dim: [ 800.0, 247.5] },
    'cebolla-picada':       { name: 'Cebolla picada',            th: 100, dim: [ 800.0, 192.4] },
    'cebolla-crispy':       { name: 'Cebolla crispy',            th: 109, dim: [ 800.0, 218.7] },
    'cebolla-caramelizada': { name: 'Cebolla caramelizada',      th:  99, dim: [ 800.0, 190.8] },
    'cebolla-grillada':     { name: 'Cebolla grillada',          th: 143, dim: [ 800.0, 339.3] },
    'lechuga':              { name: 'Lechuga repollada',         th: 129, dim: [ 800.0, 294.2] },
    'tomate':               { name: 'Tomate',                    th: 115, dim: [ 800.0, 239.8] },
    'pepinos':              { name: 'Pepinos agridulces',        th:  91, dim: [ 800.0, 175.7] },
    'ketchup':              { name: 'Ketchup',                   th:  82, dim: [ 800.0, 128.5] },
    'barbacoa':             { name: 'Salsa barbacoa',            th: 148, dim: [ 800.0, 230.9] },
    'alioli':               { name: 'Alioli de ajo negro',       th: 140, dim: [ 800.0, 219.3] },
    'mayonesa':             { name: 'Mayonesa',                  th: 156, dim: [ 800.0, 244.3] },
    'salsa-tasty':          { name: 'Salsa Tasty',               th: 165, dim: [ 800.0, 257.9] },
    'salsa-churry':         { name: 'Salsa Churry',              th: 137, dim: [ 800.0, 213.6] },
    'salsa-honey':          { name: 'Salsa Honey',               th: 138, dim: [ 800.0, 216.4] },
    'salsa-mil-islas':      { name: 'Salsa Mil Islas',           th: 137, dim: [ 800.0, 213.6], img: 'salsa-churry' },
    'pan-superior':         { name: 'Pan corona',                th: 210, dim: [ 800.0, 339.0] }
  };

  /* ---------- las 8 hamburguesas -------------------------------------
     img   = archivo de la foto, sin extension
     stack = capas del despiece, de abajo hacia arriba              */
  var BURGERS = [
    { id: 'mambastica', emoji: '🥬', name: 'Mambastica', img: 'assets/carta/mambastica.png',
      simple: 13500, doble: 15000,
      tag: 'La de la casa.',
      ing: 'Medallón de Carne 120gr, Cheddar, Panceta, Cebolla Picada, Lechuga Repollada, Salsa Tasty.',
      stack: ['pan-base', 'medallon', 'cheddar', 'panceta', 'cebolla-picada', 'lechuga', 'salsa-tasty', 'pan-superior'] },

    { id: 'provolone-black', emoji: '🧄', name: 'Provolone Black', img: 'assets/carta/provolone-black.png',
      simple: 15500, doble: 17000,
      tag: 'Provolone fundido y ajo negro.',
      ing: 'Medallón de carne 120gr, Cheddar, Panceta, Cebolla Crispy, Provolone, Alioli de Ajo Negro.',
      stack: ['pan-base', 'medallon', 'cheddar', 'provolone', 'panceta', 'cebolla-crispy', 'alioli', 'pan-superior'] },

    { id: 'cheeseburger', emoji: '🧀', name: 'Cheeseburger', img: 'assets/carta/cheeseburger.png',
      simple: 12500, doble: 14000,
      tag: 'El clasico que nunca falla.',
      ing: 'Medallón de Carne 120gr, Cheddar, Cebolla Picada, Ketchup.',
      stack: ['pan-base', 'medallon', 'cheddar', 'cebolla-picada', 'ketchup', 'pan-superior'] },

    { id: 'sweet-onion', emoji: '🧅', name: 'Sweet Onion', img: 'assets/carta/sweet-onion.png',
      simple: 13000, doble: 14500,
      tag: 'Dulce arriba, salado abajo.',
      ing: 'Medallón de Carne 120gr, Cheddar, Cebolla Caramelizada, Barbacoa.',
      stack: ['pan-base', 'medallon', 'cheddar', 'cebolla-caramelizada', 'barbacoa', 'pan-superior'] },

    { id: 'crispy', emoji: '🥓', name: 'Crispy', img: 'assets/carta/crispy.png',
      simple: 14000, doble: 15500,
      tag: 'La que nos hizo conocidos.',
      ing: 'Medallón de Carne 120gr, Cheddar, Doble Panceta, Cebolla Crispy, Salsa Churry.',
      stack: ['pan-base', 'medallon', 'cheddar', 'panceta', 'panceta', 'cebolla-crispy', 'salsa-churry', 'pan-superior'] },

    { id: 'americana', emoji: '🥒', name: 'Americana', img: 'assets/carta/americana.png',
      simple: 13500, doble: 15000,
      tag: 'Home of the american burgers.',
      ing: 'Medallón de Carne 120gr, Cheddar, Lechuga Repollada, Cebolla, Tomate, Pepino Agridulce, Mayonesa.',
      stack: ['pan-base', 'medallon', 'cheddar', 'cebolla-picada', 'lechuga', 'tomate', 'pepinos', 'mayonesa', 'pan-superior'] },

    { id: 'honey', emoji: '🍯', name: 'Honey', img: 'assets/carta/honey.png',
      simple: 13000, doble: 14500,
      tag: 'Miel y mostaza, punto justo.',
      ing: 'Medallón de Carne 120gr, Cheddar, Panceta, Salsa Honey.',
      stack: ['pan-base', 'medallon', 'cheddar', 'panceta', 'salsa-honey', 'pan-superior'] },

    { id: 'oklahoma', emoji: '🇺🇸', name: 'Oklahoma', img: 'assets/carta/oklahoma.png',
      simple: 13000, doble: 14500,
      tag: 'Cebolla prensada en la plancha.',
      ing: 'Medallón de Carne 120gr, Cheddar, Cebolla Grillada, Salsa Mil Islas.',
      stack: ['pan-base', 'medallon', 'cheddar', 'cebolla-grillada', 'salsa-mil-islas', 'pan-superior'] }
  ];

  /* ---------- helpers -------------------------------------------------- */

  /* $13.500 */
  function money(v) {
    return '$' + Number(v || 0).toLocaleString('es-AR');
  }

  function bySize(b, size) {
    return size === 'doble' ? b.doble : b.simple;
  }

  function find(id) {
    for (var i = 0; i < BURGERS.length; i++) {
      if (BURGERS[i].id === id) return BURGERS[i];
    }
    return null;
  }

  /* Placeholder con la identidad de la marca, por si todavía no está la foto */
  function placeholder(name) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
        '<rect width="400" height="300" fill="#6E0000"/>' +
        '<circle cx="200" cy="128" r="62" fill="none" stroke="#F2B22E" stroke-width="4" stroke-dasharray="9 7"/>' +
        '<text x="200" y="136" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="#FAF5F1">' +
          String(name || '?').charAt(0).toUpperCase() +
        '</text>' +
        '<text x="200" y="232" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" ' +
          'font-size="15" font-weight="700" letter-spacing="1.5" fill="#F8B9B4">FOTO EN CAMINO</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* Prueba png → jpg → jpeg → webp y cae en el placeholder.
     Si el nombre ya trae extensión (ej: 'Crispy.jpg') se usa tal cual. */
  function resolveImage(img, base, name) {
    var i = 0;
    img.alt = name || '';

    if (/\.[a-z0-9]{3,4}$/i.test(base)) {
      img.addEventListener('error', function () {
        img.src = placeholder(name);
        img.classList.add('is-placeholder');
      }, { once: true });
      img.src = encodeURI(base);
      return;
    }
    img.addEventListener('error', function next() {
      i++;
      if (i < CONFIG.exts.length) {
        img.src = encodeURI(base + '.' + CONFIG.exts[i]);
      } else {
        img.removeEventListener('error', next);
        img.src = placeholder(name);
        img.classList.add('is-placeholder');
      }
    });
    img.src = encodeURI(base + '.' + CONFIG.exts[0]);
  }

  /* URL de la página de personalización */
  function productUrl(id, size) {
    return 'producto.html?burger=' + encodeURIComponent(id) + '&size=' + encodeURIComponent(size);
  }

  /* ---------- avisos flotantes ---------------------------------------- */
  var _toastEl, _toastTimer;
  function toast(txt) {
    if (!_toastEl || !_toastEl.isConnected) {
      _toastEl = document.getElementById('toast');
      if (!_toastEl) {
        _toastEl = document.createElement('div');
        _toastEl.id = 'toast';
        _toastEl.className = 'toast';
        _toastEl.setAttribute('role', 'status');
        _toastEl.setAttribute('aria-live', 'polite');
        document.body.appendChild(_toastEl);
      }
    }
    _toastEl.textContent = txt;
    _toastEl.classList.add('on');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { _toastEl.classList.remove('on'); }, 3200);
  }

  /* ---------- portapapeles (con respaldo para navegadores viejos) ------ */
  function copiar(txt) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(txt);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    });
  }

  /* ---------- mandar un texto a WhatsApp -------------------------------
     Con waPhone cargado abre el chat con el mensaje ya escrito.
     Sin número usa el link corto y deja el pedido en el portapapeles.   */
  function enviarWhatsApp(texto) {
    if (CONFIG.waPhone) {
      window.open('https://wa.me/' + CONFIG.waPhone + '?text=' + encodeURIComponent(texto),
                  '_blank', 'noopener');
      return;
    }
    copiar(texto).then(
      function () { toast('Pedido copiado ✓ Pegalo en el chat de WhatsApp.'); },
      function () { toast('No pudimos copiar. Escribinos el pedido por el chat.'); }
    );
    window.open(CONFIG.waLink, '_blank', 'noopener');
  }


  /* Arma el stack final: repite el grupo medallon+queso segun el tamano y los
     agregados, y suma las fetas de cheddar extra justo encima del grupo.      */
  var QUESOS = ['cheddar', 'provolone'];

  /* El cheddar acompaña a cada medallón; los demás quesos de la receta van
     una sola vez por hamburguesa, sin importar cuántos medallones tenga.   */
  var QUESO_POR_MEDALLON = 'cheddar';

  function construirStack(burger, size, extras) {
    var s = (burger && burger.stack) || [];
    var i = s.indexOf('medallon');
    if (i < 0) return s.slice();

    /* los quesos que la receta apoya sobre el medallón */
    var j = i + 1;
    while (j < s.length && QUESOS.indexOf(s[j]) >= 0) j++;
    var quesos = s.slice(i + 1, j);

    var acompaña = quesos.filter(function (q) { return q === QUESO_POR_MEDALLON; });
    var unicos   = quesos.filter(function (q) { return q !== QUESO_POR_MEDALLON; });

    var cuantos = (size === 'doble' ? 2 : 1) + ((extras && extras.medallon) || 0);

    var medio = [];
    for (var k = 0; k < cuantos; k++) medio = medio.concat(['medallon'], acompaña);
    medio = medio.concat(unicos);          /* el provolone corona el conjunto */

    for (var c = 0; c < ((extras && extras.cheddar) || 0); c++) medio.push('cheddar');

    /* el resto de los agregados que tienen capa propia van sobre el grupo */
    TOPPINGS.forEach(function (t) {
      if (!t.capa || t.id === 'medallon' || t.id === 'cheddar') return;
      var q = (extras && extras[t.id]) || 0;
      for (var x = 0; x < q; x++) medio.push(t.capa);
    });

    return s.slice(0, i).concat(medio, s.slice(j));
  }

  /* ruta del png de una capa (algunas comparten arte) */
  function capaSrc(id) {
    var c = CAPAS[id];
    return 'assets/capas/' + ((c && c.img) || id) + '.png';
  }

  global.CHURRYS = {
    config: CONFIG,
    burgers: BURGERS,
    toppings: TOPPINGS,
    pagos: PAGOS,
    incluye: INCLUYE,
    dips: DIPS,
    entrega: ENTREGA,
    precioTopping: precioTopping,
    medallon: { diferencial: MEDALLON_DIFERENCIAL, pleno: MEDALLON_PLENO },
    precioMedallones: precioMedallones,
    capas: CAPAS,
    construirStack: construirStack,
    capaSrc: capaSrc,
    toast: toast,
    copiar: copiar,
    enviarWhatsApp: enviarWhatsApp,
    money: money,
    bySize: bySize,
    find: find,
    placeholder: placeholder,
    resolveImage: resolveImage,
    productUrl: productUrl
  };
})(window);
