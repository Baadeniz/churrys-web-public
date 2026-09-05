/* ==========================================================================
   Churry's · carrito
   Guarda el pedido en localStorage, así sobrevive al pasar de la carta a
   cada hamburguesa y al carrito. Lo usan producto.html y carrito.html.

   Forma de cada ítem. El subtotal de cada agregado ya viene resuelto,
   porque el precio del medallón depende del tamaño de la hamburguesa:
     { burger:'crispy', name:'Crispy', size:'doble', base:15500,
       extras:[{ id:'cheddar', name:'Cheddar feta', n:2, subtotal:1000 },
               { id:'dip', name:'Dip de salsa', n:2, subtotal:1000,
                 detalle:'Tasty, Churry' }],
       nota:'sin cebolla', qty:1 }
   ========================================================================== */
(function (global) {
  'use strict';

  var KEY   = 'churrys.carrito.v2';
  var MAX   = 20;          /* tope de líneas distintas, para no romper el mensaje */
  var items = [];

  var M = function () { return global.CHURRYS; };

  /* ---------- persistencia --------------------------------------------- */
  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY));
      items = Array.isArray(raw) ? raw.filter(valido) : [];
    } catch (e) {
      items = [];
    }
  }

  function valido(it) {
    return it && typeof it.burger === 'string' &&
           typeof it.base === 'number' && it.base >= 0 &&
           typeof it.qty === 'number' && it.qty > 0;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* modo privado */ }
    paintBadges();
    global.dispatchEvent(new CustomEvent('carrito:cambio'));
  }

  /* ---------- cuentas --------------------------------------------------- */
  function unit(it) {
    return (it.extras || []).reduce(function (acc, e) {
      return acc + (e.subtotal || 0);
    }, it.base);
  }

  function lineTotal(it) { return unit(it) * it.qty; }

  function total() {
    return items.reduce(function (acc, it) { return acc + lineTotal(it); }, 0);
  }

  function count() {
    return items.reduce(function (acc, it) { return acc + it.qty; }, 0);
  }

  /* ---------- alta / baja ----------------------------------------------- */

  /* dos líneas se funden si son la misma burger, tamaño, agregados y nota */
  function firma(it) {
    var ex = (it.extras || []).slice().sort(function (a, b) {
      return a.id < b.id ? -1 : 1;
    }).map(function (e) {
      return e.id + ':' + e.n + (e.detalle ? '(' + e.detalle + ')' : '');
    }).join(',');
    return [it.burger, it.size, ex, (it.nota || '').trim().toLowerCase()].join('|');
  }

  function add(it) {
    var f = firma(it);
    for (var i = 0; i < items.length; i++) {
      if (firma(items[i]) === f) {
        items[i].qty = Math.min(20, items[i].qty + (it.qty || 1));
        save();
        return true;
      }
    }
    if (items.length >= MAX) return false;
    items.push({
      burger: it.burger,
      name:   it.name,
      size:   it.size,
      base:   it.base,
      extras: (it.extras || []).map(function (e) {
        return { id: e.id, name: e.name, n: e.n,
                 subtotal: e.subtotal || 0, detalle: e.detalle || '' };
      }),
      nota:   (it.nota || '').trim(),
      qty:    it.qty || 1
    });
    save();
    return true;
  }

  function setQty(i, n) {
    if (!items[i]) return;
    n = Math.max(0, Math.min(20, n));
    if (n === 0) items.splice(i, 1);
    else items[i].qty = n;
    save();
  }

  function remove(i) {
    if (!items[i]) return;
    items.splice(i, 1);
    save();
  }

  function clear() { items = []; save(); }

  /* ---------- el mensaje que se manda a WhatsApp ------------------------ */
  function mensaje(pagoId, notaGeneral, entregaId) {
    var M2      = M();
    var money   = M2.money;
    var pago    = (M2.pagos || []).filter(function (p) { return p.id === pagoId; })[0];
    var entrega = (M2.entrega || []).filter(function (e) { return e.id === entregaId; })[0];
    var l       = [];

    l.push('¡Hola Churrys! Quiero hacer el siguiente pedido:');
    l.push('');

    items.forEach(function (it) {
      var b     = M2.find(it.burger);
      var emoji = (b && b.emoji) ? b.emoji + ' ' : '';
      var tam   = it.size === 'doble' ? 'DOBLE' : 'SIMPLE';

      l.push(emoji + it.name.toUpperCase() + ' (' + tam + ')');
      l.push('- Papas fritas incluidas');

      var extras = (it.extras || []).map(function (e) {
        return e.name + (e.n > 1 ? ' x' + e.n : '') +
               (e.detalle ? ' (' + e.detalle + ')' : '');
      });
      l.push('- Toppings extras: ' + (extras.length ? extras.join(', ') : 'Ninguno'));
      l.push('- Cantidad: ' + it.qty);
      l.push('- Subtotal: ' + money(lineTotal(it)));

      if (it.nota) l.push('- Aclaración: ' + it.nota);
      l.push('');
    });

    l.push('-------------------------');
    l.push('📍 Tipo de entrega: ' + (entrega ? entrega.name : 'A confirmar'));
    l.push('💵 Forma de pago: ' + (pago ? pago.name : 'A confirmar'));
    if (pago && pago.detalle) l.push('   ' + pago.detalle);

    var extra = (notaGeneral || '').trim();
    if (extra) l.push('📝 Nota del pedido: ' + extra);

    l.push('💰 Total pedido: ' + money(total()) +
           (entrega && entrega.id === 'delivery' ? ' *(Envío a cotizar)*' : ''));

    return l.join('\n');
  }

  /* ---------- contador en el encabezado --------------------------------- */
  function paintBadges() {
    var n = count();
    var nodos = document.querySelectorAll('[data-cart-count]');
    Array.prototype.forEach.call(nodos, function (el) {
      el.textContent = n;
      el.classList.toggle('vacio', n === 0);
      var host = el.closest('[data-cart-link]') || el;
      host.setAttribute('aria-label', n === 0
        ? 'Carrito vacío'
        : 'Carrito: ' + n + (n === 1 ? ' hamburguesa' : ' hamburguesas'));
    });
  }

  /* ---------- arranque --------------------------------------------------- */
  load();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', paintBadges);
  } else {
    paintBadges();
  }

  /* si el usuario tiene la carta abierta en otra pestaña, se sincroniza */
  global.addEventListener('storage', function (ev) {
    if (ev.key === KEY) {
      load();
      paintBadges();
      global.dispatchEvent(new CustomEvent('carrito:cambio'));
    }
  });

  /* Anota el pedido en el libro local para que lo vea el panel admin */
  function registrar(pagoId, entregaId) {
    if (!global.TIENDA) return 0;
    return global.TIENDA.registrar({
      total:   total(),
      pago:    pagoId,
      entrega: entregaId,
      items:   items.map(function (it) {
        return { burger: it.burger, name: it.name, size: it.size,
                 qty: it.qty, total: lineTotal(it) };
      })
    });
  }

  global.CARRITO = {
    items:     function () { return items; },
    add:       add,
    setQty:    setQty,
    remove:    remove,
    clear:     clear,
    count:     count,
    total:     total,
    unit:      unit,
    lineTotal: lineTotal,
    mensaje:   mensaje,
    registrar: registrar,
    paintBadges: paintBadges,
    MAX:       MAX
  };
})(window);
