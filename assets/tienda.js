/* ==========================================================================
   Churry's · estado de la tienda y libro de pedidos

   OJO: esto vive en localStorage, o sea en el navegador de cada persona.
   - Los interruptores apagan la venta EN ESTE EQUIPO, no para todos los
     clientes. Para eso hace falta un servidor.
   - Los pedidos se anotan en el navegador donde se hicieron, así que el
     panel solo ve los que salieron de esa misma máquina.
   Está armado para que reemplazar localStorage por llamadas a una API sea
   cambiar solo leer() y guardar() de cada bloque.
   ========================================================================== */
(function (global) {
  'use strict';

  var K_CONFIG  = 'churrys.tienda.v1';
  var K_PEDIDOS = 'churrys.pedidos.v1';
  var BACKEND_BASE = global.CHURRYS_BACKEND_URL || 'https://3000-ib2el4cl3uogkz1rtbh0e-c0004752.us1.manus.computer';

  var POR_DEFECTO = {
    abierto:       true,   /* recibe pedidos */
    ventaHabilitada: true, /* botones de compra activos */
    delivery:      true,
    retiro:        true,
    aviso:         ''      /* cartel que se muestra en la web */
  };

  /* ---------- helpers de almacenamiento -------------------------------- */
  function leer(clave, fallback) {
    try {
      var raw = localStorage.getItem(clave);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function guardar(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;   /* modo privado o cuota llena */
    }
  }

  /* ---------- configuración -------------------------------------------- */
  function config() {
    var c = leer(K_CONFIG, null);
    if (!c || typeof c !== 'object') return copiar(POR_DEFECTO);
    var out = copiar(POR_DEFECTO);
    Object.keys(POR_DEFECTO).forEach(function (k) {
      if (k in c) out[k] = c[k];
    });
    return out;
  }

  function copiar(o) {
    var r = {};
    Object.keys(o).forEach(function (k) { r[k] = o[k]; });
    return r;
  }

  function setConfig(parcial) {
    var c = config();
    Object.keys(parcial || {}).forEach(function (k) {
      if (k in POR_DEFECTO) c[k] = parcial[k];
    });
    guardar(K_CONFIG, c);
    global.dispatchEvent(new CustomEvent('tienda:cambio', { detail: c }));
    return c;
  }

  /* ¿se puede comprar ahora mismo? */
  function ventaActiva() {
    var c = config();
    return !!(c.abierto && c.ventaHabilitada);
  }

  /* ---------- libro de pedidos ------------------------------------------ */
  function pedidos() {
    var p = leer(K_PEDIDOS, []);
    return Array.isArray(p) ? p : [];
  }

  /* Deja registrado un pedido enviado. Devuelve el numero asignado. */
  function registrar(pedido) {
    var lista = pedidos();
    var reg = {
      n:       lista.length + 1,
      fecha:   new Date().toISOString(),
      total:   pedido.total || 0,
      pago:    pedido.pago || '',
      entrega: pedido.entrega || '',
      items:   (pedido.items || []).map(function (it) {
        return {
          burger: it.burger,
          name:   it.name,
          size:   it.size,
          qty:    it.qty || 1,
          total:  it.total || 0
        };
      })
    };
    lista.push(reg);
    guardar(K_PEDIDOS, lista);
    global.dispatchEvent(new CustomEvent('pedidos:cambio'));
    return reg.n;
  }

  function borrarPedidos() {
    guardar(K_PEDIDOS, []);
    global.dispatchEvent(new CustomEvent('pedidos:cambio'));
  }

  /* ---------- métricas ---------------------------------------------------- */
  function metricas(desde) {
    var lista = pedidos();
    if (desde) {
      lista = lista.filter(function (p) { return new Date(p.fecha) >= desde; });
    }

    var facturado = lista.reduce(function (a, p) { return a + (p.total || 0); }, 0);

    /* ranking de productos por unidades vendidas */
    var cuenta = {};
    lista.forEach(function (p) {
      (p.items || []).forEach(function (it) {
        var k = it.name + (it.size === 'doble' ? ' · Doble' : ' · Simple');
        if (!cuenta[k]) cuenta[k] = { nombre: k, unidades: 0, facturado: 0 };
        cuenta[k].unidades  += it.qty || 1;
        cuenta[k].facturado += it.total || 0;
      });
    });

    var ranking = Object.keys(cuenta).map(function (k) { return cuenta[k]; });
    ranking.sort(function (a, b) { return b.unidades - a.unidades; });

    var porPago = {};
    lista.forEach(function (p) {
      var k = p.pago || 'sin definir';
      porPago[k] = (porPago[k] || 0) + (p.total || 0);
    });

    var porEntrega = {};
    lista.forEach(function (p) {
      var k = p.entrega || 'sin definir';
      porEntrega[k] = (porEntrega[k] || 0) + 1;
    });

    return {
      pedidos:   lista.length,
      facturado: facturado,
      ticket:    lista.length ? Math.round(facturado / lista.length) : 0,
      unidades:  ranking.reduce(function (a, r) { return a + r.unidades; }, 0),
      ranking:   ranking,
      porPago:   porPago,
      porEntrega: porEntrega,
      lista:     lista.slice().reverse()      /* mas nuevo primero */
    };
  }

  /* ---------- cartel de tienda cerrada ------------------------------------ */

  /* Pinta el aviso y apaga los botones de compra donde corresponda.
     Lo llaman churrys.html, producto.html y carrito.html al arrancar.     */
  function aplicarEstado() {
    var c = config();
    var activa = ventaActiva();

    document.querySelectorAll('[data-venta]').forEach(function (el) {
      el.classList.toggle('venta-off', !activa);
      if ('disabled' in el) el.disabled = !activa;
      if (!activa) el.setAttribute('aria-disabled', 'true');
      else el.removeAttribute('aria-disabled');
    });

    var barra = document.getElementById('aviso-tienda');
    if (!barra) return;

    var texto = c.aviso || (!c.abierto
      ? 'Ahora mismo no estamos tomando pedidos. Volvé a probar más tarde.'
      : (!c.ventaHabilitada ? 'La carta está en pausa por un rato.' : ''));

    barra.textContent = texto;
    barra.hidden = !texto;
  }

  function sincronizarRemoto() {
    return fetch(BACKEND_BASE + '/api/public/catalog')
      .then(function (response) {
        if (!response.ok) throw new Error('No se pudo consultar el estado remoto.');
        return response.json();
      })
      .then(function (data) {
        var activa = !!(data.storeOpen && data.acceptingOrders);
        var disponibles = {};
        (data.menuItems || []).forEach(function (item) {
          disponibles[String(item.name || '').trim().toLowerCase()] = true;
        });

        document.querySelectorAll('[data-venta]').forEach(function (el) {
          var card = el.closest('[data-burger-id]');
          var burgerId = card ? card.getAttribute('data-burger-id') : document.body.getAttribute('data-burger-id');
          var burger = (global.CHURRYS && global.CHURRYS.burgers || []).filter(function (entry) { return entry.id === burgerId; })[0];
          var productAvailable = !burger || !!disponibles[String(burger.name || '').trim().toLowerCase()];
          var enabled = activa && productAvailable;
          el.classList.toggle('venta-off', !enabled);
          if ('disabled' in el) el.disabled = !enabled;
          if (!enabled) el.setAttribute('aria-disabled', 'true');
          else el.removeAttribute('aria-disabled');
        });

        var barra = document.getElementById('aviso-tienda');
        if (barra && (!activa || !(data.menuItems || []).length)) {
          barra.textContent = data.closedMessage || 'Ahora mismo no estamos tomando pedidos.';
          barra.hidden = false;
        }
        return data;
      })
      .catch(function (error) {
        console.warn('[Churrys] No se pudo sincronizar la disponibilidad remota:', error.message);
        return null;
      });
  }

  global.TIENDA = {
    config:      config,
    setConfig:   setConfig,
    ventaActiva: ventaActiva,
    pedidos:     pedidos,
    registrar:   registrar,
    borrarPedidos: borrarPedidos,
    metricas:    metricas,
    aplicarEstado: aplicarEstado,
    sincronizarRemoto: sincronizarRemoto,
    POR_DEFECTO: POR_DEFECTO
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicarEstado);
  } else {
    aplicarEstado();
  }
  global.addEventListener('tienda:cambio', aplicarEstado);
  global.addEventListener('storage', function (ev) {
    if (ev.key === K_CONFIG) aplicarEstado();
  });
})(window);
