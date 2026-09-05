/* ==========================================================================
   Churry's · despiece interactivo
   Dibuja la hamburguesa capa por capa dentro de un contenedor, y sabe
   armarla y desarmarla con transiciones suaves.

   Uso:
     var d = DESPIECE.crear(document.getElementById('stage'), {
       onCapa: function (capa) { ... }        // hover / click sobre una capa
     });
     d.set(['pan-base','medallon','cheddar','pan-superior']);   // abajo -> arriba
     d.setOpen(true);

   El stack llega de abajo hacia arriba y acá se invierte para dibujar,
   porque el DOM se pinta de la corona hacia la base.
   ========================================================================== */
(function (global) {
  'use strict';

  var SW      = 1000;   /* ancho del sistema de coordenadas de las capas */
  var GAP     = 30;     /* aire entre capas cuando esta desarmada */
  var OPEN_S  = 0.84;   /* escala de las capas al separarse */
  var MIN_VIS = 66;     /* minimo que asoma cada capa con la burger cerrada */
  var SALIDA  = 320;    /* ms de la animacion de salida */

  function crear(stage, opciones) {
    opciones = opciones || {};

    var M       = global.CHURRYS;
    var orden   = [];       /* capas de arriba hacia abajo */
    var abierto = false;
    var pin     = -1;       /* capa fijada con click */
    var ancho   = 0;

    stage.classList.add('despiece');

    /* ---------- geometria ---------------------------------------------- */
    function dim(id) {
      var c = M.capas[id];
      return (c && c.dim) || [800, 200];
    }

    function alto(id) { return dim(id)[1]; }

    /* Cuanto baja la capa siguiente cuando esta armada.
       Una capa alta encima de una baja la taparia entera, asi que el paso
       nunca es menor al necesario para que asomen MIN_VIS unidades.        */
    function grosor(id, siguiente) {
      var c = M.capas[id];
      var t = c ? Math.min(c.th, c.dim[1]) : 60;
      if (siguiente) t = Math.max(t, MIN_VIS + alto(id) - alto(siguiente));
      return t;
    }

    function ubicar() {
      var pos = [], y = 0;
      orden.forEach(function (id, i) {
        pos.push({ y: y, s: abierto ? OPEN_S : 1 });
        y += abierto
          ? dim(id)[1] * OPEN_S + GAP
          : (i === orden.length - 1 ? alto(id) : grosor(id, orden[i + 1]));
      });
      return { pos: pos, alto: abierto ? y - GAP : y };
    }

    function dibujar() {
      var w = stage.clientWidth;
      if (!w) return;
      ancho = w;

      var k = w / SW;
      var u = ubicar();
      stage.style.height = (u.alto * k) + 'px';

      Array.prototype.forEach.call(stage.children, function (el, i) {
        if (!orden[i]) return;
        var cw = dim(orden[i])[0] * k;
        el.style.width = cw + 'px';
        el.style.transform =
          'translate3d(' + (-cw / 2) + 'px,' + (u.pos[i].y * k) + 'px,0)' +
          ' scale(' + u.pos[i].s + ')';
        el.style.zIndex = orden.length - i;
      });
    }

    /* ---------- nodos ---------------------------------------------------- */
    function nuevaCapa() {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'capa entrando';
      b.innerHTML = '<span class="flota"><img alt=""></span>';

      b.addEventListener('mouseenter', function () { if (pin < 0) resaltar(indice(b)); });
      b.addEventListener('mouseleave', function () { if (pin < 0) resaltar(-1); });
      b.addEventListener('click', function () {
        var i = indice(b);
        pin = (i === pin) ? -1 : i;
        resaltar(pin);
      });

      /* dos cuadros después arranca la transicion de entrada */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { b.classList.remove('entrando'); });
      });
      return b;
    }

    function indice(el) {
      return Array.prototype.indexOf.call(stage.children, el);
    }

    /* ---------- resaltado ------------------------------------------------ */
    function resaltar(i) {
      var hay = i >= 0 && i < orden.length;
      stage.classList.toggle('elegida', hay);
      Array.prototype.forEach.call(stage.children, function (el, j) {
        el.classList.toggle('on', j === i);
      });
      if (opciones.onCapa) {
        opciones.onCapa(hay ? {
          id:     orden[i],
          nombre: (M.capas[orden[i]] || {}).name || orden[i],
          n:      orden.length - i,          /* numerada desde la base */
          total:  orden.length
        } : null);
      }
    }

    /* ---------- alta / baja de capas ------------------------------------- */
    function set(stack) {
      var nuevo = (stack || []).slice().reverse();   /* corona -> base */
      var previo = orden.length;
      orden = nuevo;

      var vivos = Array.prototype.filter.call(stage.children, function (el) {
        return !el.classList.contains('saliendo');
      });

      /* sobran nodos: se van con animacion */
      for (var i = nuevo.length; i < vivos.length; i++) {
        (function (el) {
          el.classList.add('saliendo');
          el.classList.remove('on');
          setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, SALIDA);
        })(vivos[i]);
      }

      /* faltan nodos: se suman */
      for (var j = vivos.length; j < nuevo.length; j++) {
        stage.appendChild(nuevaCapa());
      }

      /* los que salen ya no cuentan para el orden: se mandan al final */
      Array.prototype.forEach.call(stage.querySelectorAll('.saliendo'), function (el) {
        stage.appendChild(el);
      });

      /* refrescar arte y textos */
      Array.prototype.forEach.call(stage.children, function (el, i) {
        if (!nuevo[i] || el.classList.contains('saliendo')) return;
        var capa = M.capas[nuevo[i]] || {};
        var img  = el.querySelector('img');
        var src  = M.capaSrc(nuevo[i]);
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        el.setAttribute('aria-label', capa.name || nuevo[i]);
        el.querySelector('.flota').style.setProperty('--d', (i * 0.38) + 's');
      });

      if (pin >= nuevo.length) pin = -1;
      resaltar(pin);
      dibujar();
      return previo !== nuevo.length;
    }

    function setOpen(v) {
      abierto = !!v;
      stage.classList.toggle('armada', !abierto);
      dibujar();
    }

    /* ---------- soltar la capa fijada ------------------------------------
       Sin esto, al clickear una capa el resto quedaba atenuado para siempre.
       Un click en cualquier otro lado, o Escape, devuelve todo a color.   */
    function soltar() {
      if (pin < 0) return;
      pin = -1;
      resaltar(-1);
    }

    document.addEventListener('click', function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest('.capa')) return;
      soltar();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') soltar();
    });

    /* ---------- arranque -------------------------------------------------- */
    stage.classList.add('armada');
    if (global.ResizeObserver) {
      new ResizeObserver(function () {
        if (Math.abs(stage.clientWidth - ancho) > 0.5) dibujar();
      }).observe(stage);
    } else {
      global.addEventListener('resize', dibujar);
    }
    global.addEventListener('load', dibujar);

    return {
      set:        set,
      setOpen:    setOpen,
      toggle:     function () { setOpen(!abierto); return abierto; },
      abierto:    function () { return abierto; },
      redibujar:  dibujar,
      soltar:     soltar,
      capas:      function () { return orden.slice().reverse(); }
    };
  }

  global.DESPIECE = { crear: crear };
})(window);
