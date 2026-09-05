/* ==========================================================================
   Churry's · miel derritiendose en el encabezado
   Se carga en producto.html despues de assets/menu.js.
   Se activa solo con ?burger=honey; con cualquier otra hamburguesa sale
   enseguida y no inyecta nada.
   Ajustes rapidos: SOLO_EN / VELOCIDAD / LARGO / DENSIDAD (abajo).
   Origen: Encabezado-Honey-para-Claude-Code.html
   ========================================================================== */

(function () {
  'use strict';

  var SOLO_EN   = 'honey';  /* id de la hamburguesa que lleva miel */
  var VELOCIDAD = 1;        /* 0.4 lenta · 1 normal · 2 rapida */
  var LARGO     = 1;        /* largo de los chorreados */
  var DENSIDAD  = 1;        /* cantidad de chorreados */

  var header = document.querySelector('header');
  var nav    = header && header.querySelector('.nav');
  if (!header || !nav) return;

  /* --- solo en la pagina de producto de la Honey -------------------------- */
  /* la miel se activa unicamente cuando la URL pide esta hamburguesa */
  if (new URLSearchParams(location.search).get('burger') !== SOLO_EN) return;
  document.body.classList.add('honey-on');

  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'honey-drip');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = [
    '<defs>',
      '<linearGradient id="hnBody" gradientUnits="userSpaceOnUse" x1="0" y1="-10" x2="0" y2="320">',
        '<stop offset="0" stop-color="#B96C08"/>',
        '<stop offset="0.08" stop-color="#E09A18"/>',
        '<stop offset="0.20" stop-color="#F7C445"/>',
        '<stop offset="0.33" stop-color="#FFD86E"/>',
        '<stop offset="0.50" stop-color="#F0AC28"/>',
        '<stop offset="0.72" stop-color="#D88C12"/>',
        '<stop offset="1" stop-color="#B4670A"/>',
      '</linearGradient>',
      '<linearGradient id="hnSheen" gradientUnits="userSpaceOnUse" x1="0" y1="-6" x2="0" y2="300">',
        '<stop offset="0" stop-color="#FFFFFF" stop-opacity="0.34"/>',
        '<stop offset="0.22" stop-color="#FFE9B0" stop-opacity="0.10"/>',
        '<stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/>',
        '<stop offset="0.82" stop-color="#FFD27A" stop-opacity="0.10"/>',
        '<stop offset="1" stop-color="#FFF0C4" stop-opacity="0.30"/>',
      '</linearGradient>',
      '<linearGradient id="hnTop" gradientUnits="userSpaceOnUse" x1="0" y1="-6" x2="0" y2="120">',
        '<stop offset="0" stop-color="#5A2400" stop-opacity="0.45"/>',
        '<stop offset="0.30" stop-color="#8A4404" stop-opacity="0.10"/>',
        '<stop offset="1" stop-color="#8A4404" stop-opacity="0"/>',
      '</linearGradient>',
      '<clipPath id="hnClip"><use href="#hnPath"/></clipPath>',
      /* filtro "goo": funde las gotas con el chorreado como un liquido real */
      '<filter id="hnGoo" x="-15%" y="-25%" width="130%" height="190%" color-interpolation-filters="sRGB">',
        '<feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b"/>',
        '<feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="g"/>',
        '<feComposite in="SourceGraphic" in2="g" operator="atop"/>',
      '</filter>',
      '<filter id="hnSoft" x="-60%" y="-60%" width="220%" height="220%">',
        '<feGaussianBlur stdDeviation="5"/>',
      '</filter>',
      '<filter id="hnShadow" x="-20%" y="-20%" width="140%" height="200%">',
        '<feDropShadow dx="0" dy="13" stdDeviation="15" flood-color="#280A00" flood-opacity="0.55"/>',
      '</filter>',
    '</defs>',
    '<g filter="url(#hnShadow)">',
      '<g filter="url(#hnGoo)">',
        '<path id="hnPath" fill="url(#hnBody)"/>',
        '<g id="hnDrops"></g>',
      '</g>',
      '<path id="hnGloss" fill="url(#hnSheen)"/>',
      '<g clip-path="url(#hnClip)">',
        '<rect id="hnDark" x="-20" y="-20" width="4000" height="140" fill="url(#hnTop)"/>',
        '<rect id="hnStreak" x="-20" width="4000" fill="#FFF8E0" opacity="0.5" filter="url(#hnSoft)"/>',
        '<rect id="hnStreak2" x="-20" width="4000" fill="#FFFFFF" opacity="0.22" filter="url(#hnSoft)"/>',
      '</g>',
      '<path id="hnRim" fill="none" stroke="#FFEFC0" stroke-opacity="0.55" stroke-width="1.8"/>',
      '<g id="hnSpec" filter="url(#hnSoft)"></g>',
    '</g>'
  ].join('');
  header.insertBefore(svg, header.firstChild);

  var path    = svg.querySelector('#hnPath');
  var gloss   = svg.querySelector('#hnGloss');
  var rim     = svg.querySelector('#hnRim');
  var dropsG  = svg.querySelector('#hnDrops');
  var specG   = svg.querySelector('#hnSpec');
  var streak  = svg.querySelector('#hnStreak');
  var streak2 = svg.querySelector('#hnStreak2');

  var W = 0, H = 300, navH = 64, t = 0, drips = [], drops = [], raf = null, last = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function f(v) { return v.toFixed(1); }

  /* --- medir la barra: la losa de miel = alto de .nav --------------------- */
  function measure() {
    var w = header.clientWidth;
    if (!w) return;
    W = w;
    navH = nav.offsetHeight;
    H = navH + Math.round(Math.max(150, Math.min(310, w * 0.20)));
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.style.height = H + 'px';
    build();
  }

  function build() {
    if (!W) return;
    var n = Math.max(3, Math.round((W / 190) * DENSIDAD));
    var slot = W / n;
    drips = [];
    for (var i = 0; i < n; i++) {
      drips.push({
        cx:   slot * (i + 0.5) + rnd(-0.16, 0.16) * slot,
        w:    Math.min(slot * 0.34, rnd(20, 40)),
        L:    rnd(8, 90) * LARGO,
        max:  rnd(55, 175) * LARGO,
        rate: rnd(5, 18)
      });
    }
    specG.innerHTML = '';
    drips.forEach(function () {
      var e = document.createElementNS(NS, 'ellipse');
      e.setAttribute('fill', '#FFF6DA');
      e.setAttribute('opacity', '0.5');
      specG.appendChild(e);
    });
    drops.forEach(function (o) { if (o.el.parentNode) o.el.parentNode.removeChild(o.el); });
    drops = [];
    step(0);
  }

  /* borde inferior de la barra, con una respiracion muy leve */
  function baseY(i) { return navH + Math.sin(t * 0.5 + i * 1.7) * 3.5; }

  function spawn(x, y, r) {
    if (drops.length > 8) return;
    var el = document.createElementNS(NS, 'ellipse');
    el.setAttribute('fill', 'url(#hnBody)');
    dropsG.appendChild(el);
    drops.push({ x: x, y: y, r: Math.max(8, r), v: 26, el: el });
  }

  /* --- silueta: losa de la barra + chorreados con cuello fino y punta gorda */
  function buildPath() {
    var prevX = 0, prevY = baseY(-1);
    var p = 'M ' + W + ',-4 L 0,-4 L 0,' + f(prevY);

    drips.forEach(function (d, i) {
      var b = baseY(i), L = d.L, lx = d.cx - d.w, rx = d.cx + d.w;

      p += ' Q ' + f((prevX + lx) / 2) + ',' + f(Math.max(prevY, b) + 10) + ' ' + f(lx) + ',' + f(b);

      p += ' C ' + f(d.cx - d.w * 0.99) + ',' + f(b + L * 0.14) +
           ' '  + f(d.cx - d.w * 0.62) + ',' + f(b + L * 0.24) +
           ' '  + f(d.cx - d.w * 0.56) + ',' + f(b + L * 0.56);
      p += ' C ' + f(d.cx - d.w * 0.53) + ',' + f(b + L * 0.79) +
           ' '  + f(d.cx - d.w * 0.82) + ',' + f(b + L * 0.85) +
           ' '  + f(d.cx - d.w * 0.74) + ',' + f(b + L * 0.95);
      p += ' C ' + f(d.cx - d.w * 0.50) + ',' + f(b + L * 1.14) +
           ' '  + f(d.cx + d.w * 0.50) + ',' + f(b + L * 1.14) +
           ' '  + f(d.cx + d.w * 0.74) + ',' + f(b + L * 0.95);
      p += ' C ' + f(d.cx + d.w * 0.82) + ',' + f(b + L * 0.85) +
           ' '  + f(d.cx + d.w * 0.53) + ',' + f(b + L * 0.79) +
           ' '  + f(d.cx + d.w * 0.56) + ',' + f(b + L * 0.56);
      p += ' C ' + f(d.cx + d.w * 0.62) + ',' + f(b + L * 0.24) +
           ' '  + f(d.cx + d.w * 0.99) + ',' + f(b + L * 0.14) +
           ' '  + f(rx) + ',' + f(b);

      prevX = rx; prevY = b;
    });

    p += ' Q ' + f((prevX + W) / 2) + ',' + f(prevY + 10) + ' ' + W + ',' + f(prevY) + ' Z';
    return p;
  }

  function step(dt) {
    if (!W) return;
    t += dt;

    drips.forEach(function (d, i) {
      d.L += d.rate * VELOCIDAD * dt;
      if (d.L > d.max) {                        /* se corta y cae una gota */
        spawn(d.cx, baseY(i) + d.L, d.w * 0.4);
        d.L = d.max * 0.16 + rnd(0, 14);
        d.max = rnd(55, 180) * LARGO;
        d.rate = rnd(5, 18);
      }
      var e = specG.children[i];
      if (e) {
        var b = baseY(i);
        e.setAttribute('cx', f(d.cx - d.w * 0.3));
        e.setAttribute('cy', f(b + d.L * 0.38));
        e.setAttribute('rx', f(Math.max(2.5, d.w * 0.13)));
        e.setAttribute('ry', f(Math.max(6, d.L * 0.26)));
      }
    });

    for (var k = drops.length - 1; k >= 0; k--) {
      var o = drops[k];
      o.v += 1150 * dt;
      o.y += o.v * dt;
      var st = Math.min(1.5, o.v / 520);        /* se estira al caer */
      o.el.setAttribute('cx', f(o.x));
      o.el.setAttribute('cy', f(o.y));
      o.el.setAttribute('rx', f(o.r * (1 - Math.min(0.32, o.v / 2400))));
      o.el.setAttribute('ry', f(o.r * (1 + st)));
      if (o.y - 60 > H) { dropsG.removeChild(o.el); drops.splice(k, 1); }
    }

    /* reflejos horizontales dentro de la losa */
    streak.setAttribute('y', f(navH * 0.30));
    streak.setAttribute('height', f(Math.max(4, navH * 0.075)));
    streak2.setAttribute('y', f(navH * 0.58));
    streak2.setAttribute('height', f(Math.max(2, navH * 0.03)));

    var d = buildPath();
    path.setAttribute('d', d);
    gloss.setAttribute('d', d);
    rim.setAttribute('d', d);
  }

  function tick(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(reduced ? 0 : dt);
    raf = requestAnimationFrame(tick);
  }
  function play()  { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function pause() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  measure();
  if (window.ResizeObserver) new ResizeObserver(measure).observe(header);
  else window.addEventListener('resize', measure);

  document.addEventListener('visibilitychange', function () {
    document.hidden ? pause() : play();
  });
  play();
})();
