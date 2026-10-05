/* ============================================================
   FX.JS — decorative motion layer. Content lives in data.js and
   is rendered by main.js; this file only adds visual effects and
   never changes what the page says.

   Effects
   - Hero "supply network": drifting nodes, links, packets that
     travel along the routes, and a cursor that acts like an order.
   - Ambient motes drifting behind the whole page (parallax).
   - Welding-spark bursts when buttons and chips are clicked.
   - Conveyor belt of skills, meshing gears, orbit dial, tilt.
   - Scroll progress, section rail, back-to-top, count-up stats.

   Everything is skipped or frozen when the visitor has
   "reduce motion" turned on. Delete this file and its <script>
   tag in index.html to remove all of it.
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mqFine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var reduced = mqReduce.matches;
  var fine = mqFine.matches;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var SVGNS = "http://www.w3.org/2000/svg";

  var S = {
    w: window.innerWidth, h: window.innerHeight,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    scrollY: window.scrollY || 0,
    mx: -9999, my: -9999,
    tx: 0, ty: 0, ttx: 0, tty: 0,
    pal: null,
    heroVisible: true
  };

  /* ---------------- palette (follows light/dark theme) ---------------- */
  function hexToRgb(hex) {
    hex = String(hex || "").trim().replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(hex, 16);
    if (isNaN(n)) return [255, 106, 24];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  function readPalette() {
    var cs = getComputedStyle(root);
    S.pal = {
      accent: hexToRgb(cs.getPropertyValue("--accent")),
      teal: hexToRgb(cs.getPropertyValue("--accent-2")),
      ink: hexToRgb(cs.getPropertyValue("--ink")),
      dark: root.getAttribute("data-theme") === "dark"
    };
  }

  /* ---------------- canvas helpers ---------------- */
  function makeCanvas(id, cls) {
    var c = document.createElement("canvas");
    c.id = id; c.className = cls; c.setAttribute("aria-hidden", "true");
    return c;
  }
  function fitCanvas(cv, w, h) {
    cv.width = Math.max(1, Math.round(w * S.dpr));
    cv.height = Math.max(1, Math.round(h * S.dpr));
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    var ctx = cv.getContext("2d");
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    return ctx;
  }

  /* ============================================================
     1. AMBIENT MOTES — dots, crosses, rings and squares that drift
        upward and slide at different speeds as the page scrolls.
     ============================================================ */
  var amb = { cv: null, ctx: null, p: [] };

  function initAmbient() {
    amb.cv = makeCanvas("ambient", "fx-ambient");
    document.body.insertBefore(amb.cv, document.body.firstChild);
    resizeAmbient();
  }
  function resizeAmbient() {
    amb.ctx = fitCanvas(amb.cv, S.w, S.h);
    var n = clamp(Math.round((S.w * S.h) / 24000), 22, 64);
    amb.p = [];
    for (var i = 0; i < n; i++) {
      var r = Math.random();
      amb.p.push({
        x: rand(0, S.w), y: rand(0, S.h),
        r: rand(0.8, 2.3), vx: rand(-0.07, 0.07), vy: rand(-0.2, -0.04),
        d: rand(0.15, 1),
        k: r < 0.5 ? 0 : r < 0.72 ? 1 : r < 0.88 ? 2 : 3,
        acc: Math.random() < 0.16,
        a: rand(0.16, 0.4),
        rot: rand(0, 6.283), vr: rand(-0.004, 0.004)
      });
    }
  }
  function drawAmbient(dt) {
    var ctx = amb.ctx, pal = S.pal, i, p, y, col;
    var k = dt / 16.7;
    var ink = pal.dark ? [237, 239, 238] : pal.ink;
    ctx.clearRect(0, 0, S.w, S.h);
    ctx.lineWidth = 1;
    for (i = 0; i < amb.p.length; i++) {
      p = amb.p[i];
      p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k;
      if (p.x < -10) p.x = S.w + 10; else if (p.x > S.w + 10) p.x = -10;
      y = (((p.y - S.scrollY * p.d * 0.2) % S.h) + S.h) % S.h;
      col = rgba(p.acc ? pal.accent : ink, p.acc ? p.a * 1.5 : p.a * (pal.dark ? 0.75 : 0.9));
      ctx.strokeStyle = col; ctx.fillStyle = col;
      if (p.k === 0) {
        ctx.beginPath(); ctx.arc(p.x, y, p.r, 0, 6.283); ctx.fill();
      } else if (p.k === 1) {
        var s = 3 + p.r * 1.4;
        ctx.beginPath();
        ctx.moveTo(p.x - s, y); ctx.lineTo(p.x + s, y);
        ctx.moveTo(p.x, y - s); ctx.lineTo(p.x, y + s);
        ctx.stroke();
      } else if (p.k === 2) {
        ctx.beginPath(); ctx.arc(p.x, y, 3 + p.r * 1.6, 0, 6.283); ctx.stroke();
      } else {
        ctx.save(); ctx.translate(p.x, y); ctx.rotate(p.rot);
        var q = 2.2 + p.r; ctx.strokeRect(-q, -q, q * 2, q * 2);
        ctx.restore();
      }
    }
  }

  /* ============================================================
     2. HERO SUPPLY NETWORK — nodes (sites), links (routes) and
        packets (shipments). The cursor behaves like a new order.
     ============================================================ */
  var hero = { sec: null, cv: null, ctx: null, w: 0, h: 0, nodes: [], pk: [], edges: [], nextSpawn: 0 };

  function initHero() {
    hero.sec = $("#home");
    if (!hero.sec) return;
    hero.cv = makeCanvas("heroCanvas", "hero-canvas");
    hero.sec.insertBefore(hero.cv, hero.sec.firstChild);
    resizeHero();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { S.heroVisible = es[0].isIntersecting; }, { threshold: 0 }).observe(hero.sec);
    }
  }
  function resizeHero() {
    if (!hero.sec) return;
    hero.w = hero.sec.clientWidth;
    hero.h = hero.sec.offsetHeight;
    hero.ctx = fitCanvas(hero.cv, hero.w, hero.h);
    var small = hero.w < 700;
    var n = small ? 26 : clamp(Math.round((hero.w * hero.h) / 17000), 34, 66);
    hero.nodes = [];
    for (var i = 0; i < n; i++) {
      hero.nodes.push({
        x: rand(0, hero.w), y: rand(0, hero.h),
        vx: rand(-0.16, 0.16), vy: rand(-0.16, 0.16),
        r: rand(1.4, 2.5), hub: Math.random() < 0.13, rot: rand(0, 1.57)
      });
    }
    hero.pk = [];
  }
  function drawHero(dt, now, animate) {
    var ctx = hero.ctx, pal = S.pal, w = hero.w, h = hero.h;
    var nodes = hero.nodes, n = nodes.length, i, j, a, b, dx, dy, d;
    var link = w < 700 ? 105 : 150;
    var k = animate ? dt / 16.7 : 0;
    var ink = pal.dark ? [237, 239, 238] : pal.ink;
    var rect = hero.sec.getBoundingClientRect();
    var mx = S.mx - rect.left, my = S.my - rect.top;
    var mouseOn = fine && !reduced && mx > 0 && mx < w && my > 0 && my < h;

    ctx.clearRect(0, 0, w, h);

    for (i = 0; i < n; i++) {
      a = nodes[i];
      if (animate) {
        a.x += a.vx * k; a.y += a.vy * k; a.rot += 0.004 * k;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        a.x = clamp(a.x, 0, w); a.y = clamp(a.y, 0, h);
        if (mouseOn) {
          dx = a.x - mx; dy = a.y - my; d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130 && d > 0.1) {
            var f = (1 - d / 130) * 1.3 * k;
            a.x += (dx / d) * f; a.y += (dy / d) * f;
          }
        }
      }
    }

    // routes between nearby sites
    hero.edges.length = 0;
    ctx.lineWidth = 1;
    for (i = 0; i < n; i++) {
      a = nodes[i];
      for (j = i + 1; j < n; j++) {
        b = nodes[j];
        dx = a.x - b.x; dy = a.y - b.y;
        if (dx > link || dx < -link || dy > link || dy < -link) continue;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < link) {
          var al = (1 - d / link) * (pal.dark ? 0.26 : 0.2);
          ctx.strokeStyle = rgba(ink, al);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          hero.edges.push(i, j);
        }
      }
    }

    // the cursor pulls orders toward it
    if (mouseOn) {
      for (i = 0; i < n; i++) {
        a = nodes[i];
        dx = a.x - mx; dy = a.y - my; d = Math.sqrt(dx * dx + dy * dy);
        if (d < 170) {
          ctx.strokeStyle = rgba(pal.accent, (1 - d / 170) * 0.6);
          ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(a.x, a.y); ctx.stroke();
        }
      }
      ctx.strokeStyle = rgba(pal.accent, 0.7);
      ctx.beginPath(); ctx.arc(mx, my, 7, 0, 6.283); ctx.stroke();
      ctx.fillStyle = rgba(pal.accent, 0.9);
      ctx.beginPath(); ctx.arc(mx, my, 1.8, 0, 6.283); ctx.fill();
    }

    // sites: dots, and a few warehouse hubs drawn as rotating squares
    for (i = 0; i < n; i++) {
      a = nodes[i];
      if (a.hub) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
        ctx.strokeStyle = rgba(pal.accent, 0.65); ctx.lineWidth = 1.4;
        ctx.strokeRect(-5, -5, 10, 10);
        ctx.fillStyle = rgba(pal.accent, 0.9);
        ctx.fillRect(-1.6, -1.6, 3.2, 3.2);
        ctx.restore();
      } else {
        ctx.fillStyle = rgba(ink, pal.dark ? 0.42 : 0.34);
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
      }
    }

    // packets travelling along routes
    if (animate) {
      if (now > hero.nextSpawn && hero.pk.length < 15 && hero.edges.length) {
        var e = (Math.random() * (hero.edges.length / 2)) | 0;
        hero.pk.push({ i: hero.edges[e * 2], j: hero.edges[e * 2 + 1], t: 0, s: rand(0.006, 0.014) });
        hero.nextSpawn = now + rand(130, 320);
      }
      for (i = hero.pk.length - 1; i >= 0; i--) {
        var p = hero.pk[i];
        p.t += p.s * k;
        if (p.t >= 1 || !nodes[p.i] || !nodes[p.j]) { hero.pk.splice(i, 1); continue; }
        var A = nodes[p.i], B = nodes[p.j];
        var e2 = p.t < 0.5 ? 2 * p.t * p.t : 1 - Math.pow(-2 * p.t + 2, 2) / 2;
        var px = A.x + (B.x - A.x) * e2, py = A.y + (B.y - A.y) * e2;
        ctx.fillStyle = rgba(pal.accent, 0.2);
        ctx.beginPath(); ctx.arc(px, py, 6, 0, 6.283); ctx.fill();
        ctx.fillStyle = rgba(pal.accent, 0.95);
        ctx.beginPath(); ctx.arc(px, py, 2.4, 0, 6.283); ctx.fill();
      }
    }
  }

  /* ============================================================
     3. WELDING SPARKS — short bursts on button / chip clicks
     ============================================================ */
  var sp = { cv: null, ctx: null, p: [] };

  function initSparks() {
    sp.cv = makeCanvas("sparks", "fx-sparks");
    document.body.appendChild(sp.cv);
    sp.ctx = fitCanvas(sp.cv, S.w, S.h);
    document.addEventListener("click", function (e) {
      if (reduced) return;
      var t = e.target.closest && e.target.closest(".btn, .skill-chip, .filter-btn, .theme-toggle, .social-icon, .tl-toggle, .contact-link, .to-top");
      if (!t) return;
      var x = e.clientX, y = e.clientY;
      if (!x && !y) {
        var r = t.getBoundingClientRect();
        x = r.left + r.width / 2; y = r.top + r.height / 2;
      }
      burst(x, y, t.classList.contains("btn-primary") ? 24 : 15);
    }, true);
  }
  function burst(x, y, n) {
    var pal = S.pal;
    for (var i = 0; i < n; i++) {
      var a = rand(0, 6.283), v = rand(1.8, 5.6);
      sp.p.push({
        x: x, y: y, px: x, py: y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.4,
        life: 0, max: rand(24, 50),
        c: Math.random() < 0.7 ? pal.accent : [255, 200, 150]
      });
    }
    if (sp.p.length > 180) sp.p.splice(0, sp.p.length - 180);
  }
  function drawSparks() {
    var ctx = sp.ctx;
    if (!sp.p.length) { if (sp.dirty) { ctx.clearRect(0, 0, S.w, S.h); sp.dirty = false; } return; }
    sp.dirty = true;
    ctx.clearRect(0, 0, S.w, S.h);
    ctx.lineCap = "round";
    for (var i = sp.p.length - 1; i >= 0; i--) {
      var p = sp.p[i];
      p.px = p.x; p.py = p.y;
      p.vx *= 0.965; p.vy = p.vy * 0.965 + 0.13;
      p.x += p.vx; p.y += p.vy; p.life++;
      var al = 1 - p.life / p.max;
      if (al <= 0) { sp.p.splice(i, 1); continue; }
      ctx.strokeStyle = rgba(p.c, al);
      ctx.lineWidth = 0.6 + al * 1.6;
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
  }

  /* ============================================================
     4. SVG ART — gears, orbit dial and engineering marks
     ============================================================ */
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function gearD(rp, teeth, depth) {
    var pa = (Math.PI * 2) / teeth, ro = rp + depth * 0.45, rr = rp - depth * 0.55, pts = [];
    for (var i = 0; i < teeth; i++) {
      var a0 = i * pa;
      var q = [[rr, -0.42], [ro, -0.2], [ro, 0.2], [rr, 0.42]];
      for (var m = 0; m < 4; m++) {
        var r = q[m][0], a = a0 + q[m][1] * pa;
        pts.push((r * Math.cos(a)).toFixed(2) + " " + (r * Math.sin(a)).toFixed(2));
      }
    }
    return "M" + pts.join("L") + "Z";
  }
  function polyD(r, n, rot) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = rot + (i * Math.PI * 2) / n;
      pts.push((r * Math.cos(a)).toFixed(2) + " " + (r * Math.sin(a)).toFixed(2));
    }
    return "M" + pts.join("L") + "Z";
  }

  var gearsA = null, gearsB = null;
  function initHeroGears() {
    var host = $("#heroGears");
    if (!host) return;
    var svg = el("svg", { viewBox: "0 0 200 200", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linejoin": "round" }, host);
    // pitch radii chosen so the tooth spacing matches: 12 teeth @52 and 6 teeth @26
    var ax = 70, ay = 70, bx = ax + 78 * Math.cos(0.7), by = ay + 78 * Math.sin(0.7);
    gearsA = el("g", {}, svg);
    el("path", { d: gearD(52, 12, 9), transform: "translate(" + ax + " " + ay + ")" }, gearsA);
    var innerA = el("g", { transform: "translate(" + ax + " " + ay + ")" }, gearsA);
    el("circle", { r: 30, "stroke-dasharray": "3 5", opacity: ".7" }, innerA);
    el("circle", { r: 9 }, innerA);
    for (var s = 0; s < 6; s++) {
      var an = (s * Math.PI) / 3;
      el("line", { x1: (9 * Math.cos(an)).toFixed(1), y1: (9 * Math.sin(an)).toFixed(1), x2: (30 * Math.cos(an)).toFixed(1), y2: (30 * Math.sin(an)).toFixed(1), opacity: ".55" }, innerA);
    }
    gearsB = el("g", {}, svg);
    el("path", { d: gearD(26, 6, 9), transform: "translate(" + bx.toFixed(1) + " " + by.toFixed(1) + ")" }, gearsB);
    var innerB = el("g", { transform: "translate(" + bx.toFixed(1) + " " + by.toFixed(1) + ")" }, gearsB);
    el("circle", { r: 8 }, innerB);
    el("circle", { r: 2.4, fill: "currentColor", stroke: "none" }, innerB);
    gearsA._c = [ax, ay]; gearsB._c = [bx, by];
    setGearAngle(0);
  }
  var lastGear = 0;
  function setGearAngle(t) {
    if (!gearsA) return;
    // A turns one way, B turns the opposite way at twice the speed (12:6 teeth)
    var a = t + 10, b = -2 * t + 10;
    gearsA.setAttribute("transform", "rotate(" + a.toFixed(2) + " " + gearsA._c[0] + " " + gearsA._c[1] + ")");
    gearsB.setAttribute("transform", "rotate(" + b.toFixed(2) + " " + gearsB._c[0].toFixed(1) + " " + gearsB._c[1].toFixed(1) + ")");
    lastGear = t;
  }

  var dial = null;
  function initOrbit() {
    var host = $("#heroOrbit");
    if (!host) return;
    var svg = el("svg", { viewBox: "-300 -300 600 600", fill: "none", stroke: "currentColor" }, host);
    // rotating tick dial
    dial = el("g", { opacity: ".5" }, svg);
    for (var i = 0; i < 90; i++) {
      var an = (i / 90) * Math.PI * 2, long = i % 5 === 0, r1 = 282, r2 = long ? 268 : 274;
      el("line", {
        x1: (r1 * Math.cos(an)).toFixed(1), y1: (r1 * Math.sin(an)).toFixed(1),
        x2: (r2 * Math.cos(an)).toFixed(1), y2: (r2 * Math.sin(an)).toFixed(1),
        "stroke-width": long ? 1.5 : 1, opacity: long ? ".9" : ".55"
      }, dial);
    }
    // dashed ring with an orbiting shipment
    var ring = el("g", {}, svg); ring._id = "ringA";
    el("circle", { r: 250, "stroke-width": 1, "stroke-dasharray": "2 7", opacity: ".55" }, ring);
    el("circle", { cx: 250, cy: 0, r: 5, style: "fill:var(--accent);stroke:none" }, ring);
    el("circle", { cx: 250, cy: 0, r: 11, style: "stroke:var(--accent)", "stroke-width": 1, opacity: ".5" }, ring);
    var ring2 = el("g", {}, svg);
    el("circle", { r: 228, "stroke-width": 1, opacity: ".35" }, ring2);
    el("circle", { cx: -228, cy: 0, r: 3.4, fill: "currentColor", stroke: "none", opacity: ".8" }, ring2);
    // registration marks
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
      var x = c[0] * 288, y = c[1] * 288;
      el("path", { d: "M" + (x - 9) + " " + y + "H" + (x + 9) + "M" + x + " " + (y - 9) + "V" + (y + 9), "stroke-width": 1.3, opacity: ".55" }, svg);
    });
    dial._ring = ring; dial._ring2 = ring2;
  }
  function setOrbitAngle(t) {
    if (!dial) return;
    dial.setAttribute("transform", "rotate(" + (t * 0.25).toFixed(2) + ")");
    dial._ring.setAttribute("transform", "rotate(" + (t * 0.9).toFixed(2) + ")");
    dial._ring2.setAttribute("transform", "rotate(" + (-t * 0.6).toFixed(2) + ")");
  }

  // small engineering marks that sit in the empty corner beside section headings
  var decos = [];
  function decoSVG(kind) {
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "-60 -60 120 120");
    svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.6"); svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("stroke-linecap", "round");
    var g = el("g", {}, svg), i, an;
    if (kind === "gear") {
      el("path", { d: gearD(42, 14, 8) }, g);
      el("circle", { r: 24, "stroke-dasharray": "3 5" }, g);
      el("circle", { r: 8 }, g);
    } else if (kind === "nut") {
      el("path", { d: polyD(48, 6, 0.5236) }, g);
      el("path", { d: polyD(33, 6, 0.5236), opacity: ".6" }, g);
      el("circle", { r: 19 }, g);
      el("circle", { r: 13, "stroke-dasharray": "2 4" }, g);
    } else if (kind === "cube") {
      el("path", { d: "M0 -40L35 -20L0 0L-35 -20Z" }, g);
      el("path", { d: "M-35 -20L0 0L0 40L-35 20Z" }, g);
      el("path", { d: "M0 0L35 -20L35 20L0 40Z" }, g);
      el("path", { d: "M-17.5 -30L17.5 -10", opacity: ".6" }, g);
    } else if (kind === "cycle") {
      // three chasing arrows: a nod to closed-loop / reverse logistics
      for (i = 0; i < 3; i++) {
        var a0 = (i * 2 * Math.PI) / 3 - 1.35, a1 = a0 + 1.65, r = 38;
        var x0 = r * Math.cos(a0), y0 = r * Math.sin(a0), x1 = r * Math.cos(a1), y1 = r * Math.sin(a1);
        el("path", { d: "M" + x0.toFixed(1) + " " + y0.toFixed(1) + "A" + r + " " + r + " 0 0 1 " + x1.toFixed(1) + " " + y1.toFixed(1) }, g);
        var tx = -Math.sin(a1), ty = Math.cos(a1), nx = Math.cos(a1), ny = Math.sin(a1);
        el("path", { d: "M" + (x1 + tx * 11).toFixed(1) + " " + (y1 + ty * 11).toFixed(1) + "L" + (x1 + nx * 7).toFixed(1) + " " + (y1 + ny * 7).toFixed(1) + "L" + (x1 - nx * 7).toFixed(1) + " " + (y1 - ny * 7).toFixed(1) + "Z" }, g);
      }
      el("circle", { r: 4, fill: "currentColor", stroke: "none" }, g);
    } else {
      el("circle", { r: 40 }, g);
      el("circle", { r: 25, opacity: ".7" }, g);
      el("circle", { r: 10 }, g);
      el("circle", { r: 48, "stroke-dasharray": "2 6", opacity: ".6" }, g);
      el("path", { d: "M-56 0H-14M14 0H56M0 -56V-14M0 14V56" }, g);
      for (i = -3; i <= 3; i++) {
        if (i === 0) continue;
        el("path", { d: "M" + (i * 12) + " -3V3M-3 " + (i * 12) + "H3", opacity: ".7" }, g);
      }
    }
    svg._g = g;
    return svg;
  }
  function initDecos() {
    var plan = [
      ["experience", "gear", 1, false],
      ["education", "nut", -1, false],
      ["skills", "cycle", 1, false],
      ["work", "target", -1, false],
      ["recognition", "cube", 0, true],
      ["resume", "gear", -1, false]
    ];
    plan.forEach(function (pl) {
      var wrap = $("#" + pl[0] + " > .wrap");
      if (!wrap) return;
      var d = document.createElement("div");
      d.className = "deco" + (pl[3] ? " small" : "");
      d.setAttribute("aria-hidden", "true");
      var svg = decoSVG(pl[1]);
      d.appendChild(svg);
      wrap.insertBefore(d, wrap.firstChild);
      var item = { host: d, g: svg._g, dir: pl[2], kind: pl[1], visible: false, sec: wrap.parentNode };
      decos.push(item);
    });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          for (var i = 0; i < decos.length; i++) if (decos[i].sec === e.target) decos[i].visible = e.isIntersecting;
        });
      }, { rootMargin: "80px 0px" });
      decos.forEach(function (d) { io.observe(d.sec); });
    } else decos.forEach(function (d) { d.visible = true; });
  }
  function updateDecos(now) {
    for (var i = 0; i < decos.length; i++) {
      var d = decos[i];
      if (!d.visible) continue;
      if (d.kind === "cube") {
        d.g.setAttribute("transform", "translate(0 " + (Math.sin(now / 900) * 5).toFixed(2) + ")");
      } else {
        var ang = d.dir * (S.scrollY * 0.08 + now * 0.006);
        d.g.setAttribute("transform", "rotate(" + ang.toFixed(2) + ")");
      }
    }
  }

  /* ============================================================
     5. CONVEYOR BELT — skills, tools and interests ride the line
     ============================================================ */
  function uniq(a) {
    var seen = {}, out = [];
    a.forEach(function (x) { if (x && !seen[x]) { seen[x] = 1; out.push(x); } });
    return out;
  }
  function crateHTML(t) { return '<span class="crate"><i></i>' + String(t).replace(/</g, "&lt;") + "</span>"; }

  var beltLanes = [];
  function initBelt() {
    var lane1 = $("#beltLane1"), lane2 = $("#beltLane2");
    if (!lane1 || !lane2) return;
    var skills = [], tools = [];
    if (typeof SKILL_CATEGORIES !== "undefined") SKILL_CATEGORIES.forEach(function (c) { c.skills.forEach(function (s) { skills.push(s.name); }); });
    if (typeof PROJECTS !== "undefined") PROJECTS.forEach(function (p) { (p.tools || []).forEach(function (t) { tools.push(t); }); });
    var a = uniq(skills.concat(tools)).slice(0, 24);
    var b = (typeof SITE !== "undefined" && SITE.about && SITE.about.academicInterests) || [];
    if (!a.length) { lane1.parentNode.style.display = "none"; return; }
    fill(lane1, a, 46);
    if (b.length) fill(lane2, b.concat(b.length < 6 ? b : []), 34); else lane2.style.display = "none";
    function fill(lane, items, speed) {
      var track = $(".belt-track", lane);
      var html = items.map(crateHTML).join("");
      track.innerHTML = html + html;
      beltLanes.push({ lane: lane, track: track, speed: speed });
    }
    sizeBelt();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeBelt);
  }
  function sizeBelt() {
    beltLanes.forEach(function (b) {
      var half = b.track.scrollWidth / 2;
      if (!half) return;
      b.lane.style.setProperty("--dur", (half / b.speed).toFixed(1) + "s");
      b.lane.style.setProperty("--rdur", (40 / b.speed).toFixed(3) + "s");
    });
  }

  /* ============================================================
     6. HERO POLISH — split headline, focus ticker, count-up stats
     ============================================================ */
  function splitHeadline() {
    var h = $(".hero-name");
    if (!h || reduced) return;
    var words = h.textContent.trim().split(/\s+/);
    h.setAttribute("aria-label", words.join(" "));
    h.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w.replace(/</g, "&lt;") + "</span></span>";
    }).join(" ");
  }

  /* ---------------- hero watermark: large, faint, behind the copy ----------
     Reuses the same sheet number already printed in the hero's own
     flow-node (data-n="01") rather than inventing separate text. */
  function initWatermark() {
    var heroNode = $("#home .flow-node");
    var host = $("#home .hero-figure") || $("#home .wrap");
    if (!heroNode || !host) return;
    var n = heroNode.getAttribute("data-n") || "01";
    var mark = document.createElement("div");
    mark.className = "hero-watermark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = n;
    host.insertBefore(mark, host.firstChild);
  }

  /* ---------------- custom cursor: dot + lagging ring, desktop only ------- */
  function initCursor() {
    if (!fine || reduced) return;
    var dot = document.createElement("div"), ring = document.createElement("div");
    dot.className = "cursor-dot"; ring.className = "cursor-ring";
    document.body.appendChild(dot); document.body.appendChild(ring);
    var rx = -100, ry = -100, tx = -100, ty = -100, active = false;
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      if (!active) { active = true; root.classList.add("fx-cursor"); rx = ry = e.clientX; }
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
      var t = e.target.closest && e.target.closest("a, button, .btn, .skill-chip, .filter-btn, .project-card, input, textarea, .theme-toggle");
      ring.classList.toggle("hover", !!t);
    }, { passive: true });
    window.addEventListener("blur", function () { root.classList.remove("fx-cursor"); dot.style.opacity = "0"; ring.style.opacity = "0"; });
    document.addEventListener("mouseenter", function () { if (active) root.classList.add("fx-cursor"); });
    (function loop() {
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------- magnetic pull on buttons and social icons ------------- */
  function initMagnetic() {
    if (!fine || reduced) return;
    var targets = $$(".btn, .social-icon");
    targets.forEach(function (t) {
      t.addEventListener("pointermove", function (e) {
        var r = t.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        t.style.transform = "translate(" + (x * 0.22).toFixed(1) + "px," + (y * 0.28).toFixed(1) + "px)";
      });
      t.addEventListener("pointerleave", function () { t.style.transform = ""; });
    });
  }

  function initCounters() {
    var nums = $$("#heroStats .num");
    if (!nums.length) return;
    var items = nums.map(function (n) {
      var txt = n.textContent.trim(), m = txt.match(/^(\d+(?:\.\d+)?)(.*)$/);
      return m ? { el: n, end: parseFloat(m[1]), dec: (m[1].split(".")[1] || "").length, tail: m[2], txt: txt } : null;
    }).filter(Boolean);
    if (!items.length || reduced) return;
    items.forEach(function (it) { it.el.textContent = (0).toFixed(it.dec) + it.tail; });
    var started = false;
    function run() {
      if (started) return; started = true;
      var t0 = performance.now(), dur = 1400;
      (function step(now) {
        var p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
        items.forEach(function (it) { it.el.textContent = (it.end * e).toFixed(it.dec) + it.tail; });
        if (p < 1) requestAnimationFrame(step);
        else items.forEach(function (it) { it.el.textContent = it.txt; });
      })(t0);
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.4 });
      io.observe($("#heroStats"));
    } else run();
  }

  /* ============================================================
     7. NAVIGATION EXTRAS — progress bar, section rail, back-to-top,
        flow-line draw-in, card tilt
     ============================================================ */
  var railLinks = [], secs = [], progressEl, toTop, toTopRing, ticking = false;

  function initRail() {
    var rail = $("#rail");
    secs = $$("section[id]");
    if (rail) {
      secs.forEach(function (s) {
        var label = s.id === "home" ? "Home" : (($(".flow-node span", s) || {}).textContent || s.id);
        var a = document.createElement("a");
        a.href = "#" + s.id; a.setAttribute("aria-label", label);
        a.innerHTML = "<span>" + label.replace(/</g, "&lt;") + "</span>";
        rail.appendChild(a);
        railLinks.push(a);
      });
    }
    progressEl = $("#progress"); toTop = $("#toTop"); toTopRing = $("#toTopRing");
    if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      S.scrollY = window.scrollY || 0;
      var max = Math.max(1, document.documentElement.scrollHeight - S.h);
      var p = clamp(S.scrollY / max, 0, 1);
      if (progressEl) progressEl.style.setProperty("--p", p.toFixed(4));
      if (toTop) {
        toTop.classList.toggle("show", S.scrollY > 600);
        if (toTopRing) toTopRing.style.strokeDashoffset = (125.66 * (1 - p)).toFixed(2);
      }
      if (railLinks.length) {
        var y = S.scrollY + S.h * 0.35, cur = 0;
        for (var i = 0; i < secs.length; i++) if (secs[i].offsetTop <= y) cur = i;
        railLinks.forEach(function (a, i) { a.classList.toggle("active", i === cur); });
      }
    });
  }

  function initFlowNodes() {
    var nodes = $$(".flow-node");
    if (!("IntersectionObserver" in window) || reduced) { nodes.forEach(function (n) { n.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  function initTilt() {
    if (!fine || reduced) return;
    document.addEventListener("pointermove", function (e) {
      var c = e.target.closest && e.target.closest(".project-card");
      if (!c) return;
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--ry", ((x - 0.5) * 9).toFixed(2) + "deg");
      c.style.setProperty("--rx", ((0.5 - y) * 7).toFixed(2) + "deg");
      c.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      c.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      var c = e.target.closest && e.target.closest(".project-card");
      if (c && !c.contains(e.relatedTarget)) { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); }
    });
  }

  /* ============================================================
     MAIN LOOP
     ============================================================ */
  var fig = null, last = 0, running = false;

  function updateFigure() {
    if (!fig || !fine || reduced) return;
    S.tx += (S.ttx - S.tx) * 0.08; S.ty += (S.tty - S.ty) * 0.08;
    fig.style.setProperty("--tx", S.tx.toFixed(3));
    fig.style.setProperty("--ty", S.ty.toFixed(3));
  }

  function frame(now) {
    if (document.hidden) { running = false; return; }
    var dt = Math.min(50, now - last); last = now;
    drawAmbient(dt);
    if (S.heroVisible && hero.ctx) drawHero(dt, now, true);
    if (S.heroVisible) {
      updateFigure();
      var t = now * 0.006 + S.scrollY * 0.05;
      setGearAngle(t); setOrbitAngle(t);
    }
    updateDecos(now);
    drawSparks();
    requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduced) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }

  function renderStatic() {
    drawAmbient(0);
    if (hero.ctx) drawHero(0, 0, false);
    setGearAngle(0); setOrbitAngle(0);
    updateDecos(0);
  }

  function onResize() {
    S.w = window.innerWidth; S.h = window.innerHeight;
    S.dpr = Math.min(window.devicePixelRatio || 1, 2);
    resizeAmbient(); resizeHero();
    if (sp.cv) sp.ctx = fitCanvas(sp.cv, S.w, S.h);
    sizeBelt(); onScroll();
    if (reduced) renderStatic();
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    readPalette();
    initAmbient();
    initHero();
    initSparks();
    initHeroGears();
    initOrbit();
    initDecos();
    initBelt();
    splitHeadline();
    initWatermark();
    initCounters();
    initRail();
    initFlowNodes();
    initTilt();
    initCursor();
    initMagnetic();

    fig = $("#heroFigure");
    if (fine && !reduced) {
      window.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        S.mx = e.clientX; S.my = e.clientY;
        S.ttx = clamp((e.clientX / S.w - 0.5) * 2, -1, 1);
        S.tty = clamp((e.clientY / S.h - 0.5) * 2, -1, 1);
      }, { passive: true });
      root.addEventListener("mouseleave", function () { S.mx = S.my = -9999; S.ttx = S.tty = 0; });
      window.addEventListener("blur", function () { S.mx = S.my = -9999; S.ttx = S.tty = 0; });
    }

    // repaint colours when the theme is toggled
    new MutationObserver(function () { readPalette(); if (reduced) renderStatic(); })
      .observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    if (hero.sec && "ResizeObserver" in window) {
      var ht;
      new ResizeObserver(function () {
        clearTimeout(ht);
        ht = setTimeout(function () {
          if (Math.abs(hero.sec.offsetHeight - hero.h) > 2 || Math.abs(hero.sec.clientWidth - hero.w) > 2) { resizeHero(); if (reduced) renderStatic(); }
        }, 120);
      }).observe(hero.sec);
    }

    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(onResize, 160); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) start(); });

    root.classList.add("fx-ready");
    if (reduced) renderStatic(); else start();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
