/* 循阶 · 主页：滚动叙事、指针视差、图表绘制、对话演示与虚拟板示意 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var raf = window.requestAnimationFrame.bind(window);
  /* GSAP 运动层存在时，入场、视差、解码、磁吸与数字由 motion.js 统一接管 */
  var G = !!window.gsap;

  /* ── 导航：描边、进度线、当前区块 ── */
  var nav = document.getElementById('nav');
  var navProgress = document.getElementById('navProgress');
  var navLinks = document.getElementById('navLinks');

  /* ── 移动端菜单 ── */
  var menuBtn = document.getElementById('menuBtn');
  menuBtn.addEventListener('click', function () {
    var open = navLinks.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  /* ── 入场级联 ── */
  var revealables = document.querySelectorAll('.reveal');
  if (G) {
    /* 交给 GSAP：此处只保证元素可见，避免 CSS 动画与 GSAP 内联样式互相覆盖 */
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── 单条 rAF 滚动管线：进度线 / tray 视差 / 叙事计量 ── */
  var tray = document.querySelector('.tray-shell');
  var capScroll = document.getElementById('capScroll');
  var capBar = document.getElementById('capBar');
  var ptX = 0, ptY = 0;
  var scrollTick = 0;

  function onFrame() {
    scrollTick = 0;
    var vh = window.innerHeight || 1;
    var doc = document.documentElement;
    var max = doc.scrollHeight - vh;
    if (navProgress) navProgress.style.setProperty('--np', (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0).toFixed(2) + '%');
    nav.classList.toggle('is-stuck', window.scrollY > 8);

    if (tray && !G) {
      var r = tray.getBoundingClientRect();
      var p = 1 - Math.min(1, Math.max(0, (r.top - vh * 0.3) / (vh * 0.62)));
      var tilt = 5 - 5 * p - ptY * 1.6;
      tray.style.setProperty('--tilt', tilt.toFixed(2) + 'deg');
      tray.style.setProperty('--tiltY', (ptX * 1.5).toFixed(2) + 'deg');
    }
    if (capScroll && capBar) {
      var cr = capScroll.getBoundingClientRect();
      var cp = (vh * 0.5 - cr.top) / Math.max(1, cr.height - vh * 0.2);
      capBar.style.width = (Math.min(1, Math.max(0, cp)) * 100).toFixed(2) + '%';
    }
  }
  function requestFrame() { if (!scrollTick) scrollTick = raf(onFrame); }
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);
  onFrame();

  /* ── 指针：首屏聚光 + tray 视差 ── */
  var spot = document.getElementById('spot');
  var hero = document.querySelector('.hero');
  if (fine && hero && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      var hr = hero.getBoundingClientRect();
      ptX = (e.clientX - hr.left) / hr.width - 0.5;
      ptY = (e.clientY - hr.top) / hr.height - 0.5;
      if (spot) {
        spot.style.setProperty('--mx', ((e.clientX - hr.left) / hr.width * 100).toFixed(2) + '%');
        spot.style.setProperty('--my', ((e.clientY - hr.top) / hr.height * 100).toFixed(2) + '%');
        spot.classList.add('is-on');
      }
      requestFrame();
    }, { passive: true });
    hero.addEventListener('pointerleave', function () {
      ptX = 0; ptY = 0;
      if (spot) spot.classList.remove('is-on');
      requestFrame();
    });
  }

  /* ── 卡片边缘光标高亮 ── */
  if (fine) {
    document.querySelectorAll('.glow').forEach(function (el) {
      var frame = 0, ev = null;
      el.addEventListener('pointermove', function (e) {
        ev = e;
        if (frame) return;
        frame = raf(function () {
          frame = 0;
          var r = el.getBoundingClientRect();
          el.style.setProperty('--gx', ((ev.clientX - r.left) / r.width * 100).toFixed(2) + '%');
          el.style.setProperty('--gy', ((ev.clientY - r.top) / r.height * 100).toFixed(2) + '%');
        });
      }, { passive: true });
    });

    /* ── 磁吸主按钮（GSAP 在场时由 motion.js 用 quickTo 弹性磁吸接管） ── */
    if (!G) {
      document.querySelectorAll('.btn-primary, .btn-solid-light').forEach(function (b) {
        b.classList.add('magnet');
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect();
          var dx = (e.clientX - r.left) / r.width - 0.5;
          var dy = (e.clientY - r.top) / r.height - 0.5;
          b.style.transform = 'translate(' + (dx * 7).toFixed(2) + 'px,' + (dy * 5 - 1).toFixed(2) + 'px)';
        }, { passive: true });
        b.addEventListener('pointerleave', function () { b.style.transform = ''; });
      });
    }
  }

  /* ── 眉标解码动画 ── */
  if (!G && !reduce && 'IntersectionObserver' in window) {
    var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/-·';
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        dio.unobserve(en.target);
        var el = en.target, final = el.textContent, t0 = 0;
        (function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 620);
          var solid = Math.floor(k * final.length);
          var out = final.slice(0, solid);
          for (var i = solid; i < final.length; i++) {
            out += final[i] === ' ' ? ' ' : CHARS[(Math.random() * CHARS.length) | 0];
          }
          el.textContent = out;
          if (k < 1) raf(step); else el.textContent = final;
        })(performance.now());
      });
    }, { threshold: 0.9 });
    document.querySelectorAll('.eyebrow-en').forEach(function (el) { dio.observe(el); });
  }

  /* ── 滚动叙事：步骤驱动视觉切换 ── */
  var steps = Array.prototype.slice.call(document.querySelectorAll('.cap-step'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tablist .tab'));
  var pill = document.getElementById('tabPill');
  var slides = {};
  document.querySelectorAll('.cap-slide').forEach(function (el) { slides[el.id] = el; });
  var active = 'v-home';
  var barHome = document.getElementById('barHome');

  function movePill(tab) {
    if (!pill || !tab) return;
    pill.style.left = tab.offsetLeft + 'px';
    pill.style.top = tab.offsetTop + 'px';
    pill.style.width = tab.offsetWidth + 'px';
    pill.style.height = tab.offsetHeight + 'px';
    pill.classList.add('is-set');
  }
  function activate(slideId) {
    if (!slides[slideId] || slideId === active) return;
    active = slideId;
    Object.keys(slides).forEach(function (k) { slides[k].classList.toggle('is-on', k === slideId); });
    steps.forEach(function (st) { st.classList.toggle('is-on', st.getAttribute('data-slide') === slideId); });
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-slide') === slideId;
      t.classList.toggle('is-on', on);
      if (on) { t.setAttribute('aria-current', 'true'); movePill(t); } else { t.removeAttribute('aria-current'); }
    });
    if (slideId === 'v-home' && barHome) barHome.style.width = '38%';
  }
  if (steps.length && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) activate(en.target.getAttribute('data-slide'));
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (st) { sio.observe(st); });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var target = document.querySelector(t.getAttribute('href'));
      if (target) activate(target.getAttribute('data-slide'));
    });
  });
  function syncPill() {
    var on = document.querySelector('.tablist .tab.is-on');
    if (pill && on) {
      pill.style.transition = 'none';
      movePill(on);
      raf(function () { pill.style.transition = ''; });
    }
  }
  window.addEventListener('resize', syncPill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncPill);
  syncPill();

  /* ── 教学回路：六处断点依次接回，点节点看那一处的回答 ── */
  var spots = Array.prototype.slice.call(document.querySelectorAll('.cspot'));
  var nodes = Array.prototype.slice.call(document.querySelectorAll('.cnode'));
  var cpanes = Array.prototype.slice.call(document.querySelectorAll('.cpane'));
  var counter = document.getElementById('circuitN');
  var rail = document.querySelector('.circuit-rail');

  function countClosed() {
    if (counter) counter.textContent = document.querySelectorAll('.cspot.is-closed').length;
  }
  function pickCircuit(i) {
    nodes.forEach(function (n, k) {
      n.classList.toggle('is-on', k === i);
      n.setAttribute('aria-pressed', String(k === i));
    });
    cpanes.forEach(function (p, k) {
      p.classList.toggle('is-on', k === i);
      if (k === i) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
    });
  }
  nodes.forEach(function (n, i) {
    n.addEventListener('click', function () { pickCircuit(i); });
    n.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var j = (i + d + nodes.length) % nodes.length;
      nodes[j].focus();
      pickCircuit(j);
    });
  });
  if (spots.length) {
    pickCircuit(0);
    if (reduce || !('IntersectionObserver' in window)) {
      spots.forEach(function (li) { li.classList.add('is-closed'); });
      countClosed();
    } else if (rail) {
      var closeAll = function () {
        spots.forEach(function (li) { li.classList.add('is-closed'); });
        countClosed();
      };
      /* 刷新后区块可能已在视口上方，IO 不会再触发：直接判定为已接回 */
      if (rail.getBoundingClientRect().bottom < 0) {
        closeAll();
      } else {
        var rio = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            rio.unobserve(en.target);
            spots.forEach(function (li, i) {
              setTimeout(function () { li.classList.add('is-closed'); countClosed(); }, 200 + i * 190);
            });
          });
        }, { threshold: 0.3 });
        rio.observe(rail);
      }
    }
  }

  /* ── 对话演示：点追问选项，Agent 只往前推一步 ── */
  var REPLIES = [
    '那先别改，验证它。把 seg_out 的位宽和 tbl 每一项的宽度并排写出来，数一遍——如果两边真的不等，你会先动声明，还是先动表？',
    '波形我看了。先不给结论：把游标放到 120ns，看 seg_out 的跳变比 clk 的上升沿早还是晚。早，意味着什么？',
    '只给一个判据：共阴是「给高电平点亮」。那你现在输出 1 的时候，该亮的段真的亮了吗？据此反推你板子上是哪一种。'
  ];
  var chat = document.getElementById('chatDemo');
  var chatLive = document.getElementById('chatLive');
  var chatUser = document.getElementById('chatUser');
  var busy = false;

  if (chat) {
    chat.querySelectorAll('.opt[data-i]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (busy) return;
        busy = true;
        chat.querySelectorAll('.opt[data-i]').forEach(function (o) {
          o.disabled = true;
          o.classList.toggle('is-picked', o === btn);
        });
        chatUser.textContent = btn.textContent;
        chatUser.classList.remove('in');
        void chatUser.offsetWidth;
        chatUser.classList.add('in');

        var turn = document.createElement('div');
        turn.className = 'msg-ai new';
        turn.innerHTML = '<div class="ai-head"><img src="assets/ip/pose-glasses.png" alt="" width="26" height="31">'
          + '<span class="think busy">思考中…</span></div><p class="body"></p>';
        chatLive.appendChild(turn);
        var chip = turn.querySelector('.think');
        var body = turn.querySelector('.body');
        var text = REPLIES[Number(btn.getAttribute('data-i'))] || '';

        function type() {
          var i = 0;
          var caret = document.createElement('span');
          caret.className = 'typing';
          body.appendChild(caret);
          (function next() {
            if (i >= text.length) {
              caret.remove();
              chip.classList.remove('busy');
              chip.textContent = '已思考 ' + (4 + (text.length % 5)) + ' 秒';
              busy = false;
              chat.querySelectorAll('.opt[data-i]').forEach(function (o) { o.disabled = false; });
              return;
            }
            caret.insertAdjacentText('beforebegin', text[i++]);
            chat.scrollTop = chat.scrollHeight;
            setTimeout(next, reduce ? 0 : 42);
          })();
        }
        chat.scrollTop = chat.scrollHeight;
        setTimeout(type, reduce ? 0 : 760);
      });
    });
  }

  /* ── 示波器与页脚字标：进入视口才播 ── */
  if ('IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-on');
        pio.unobserve(en.target);
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('.scope').forEach(function (el) { pio.observe(el); });
  } else {
    document.querySelectorAll('.scope').forEach(function (el) { el.classList.add('is-on'); });
  }

  if (!G) {
    /* ── 基线数字（GSAP 在场时由 motion.js 用 expo 缓出接管） ── */
    function runCount(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = (el.getAttribute('data-count') || '').indexOf('.') > -1 ? 1 : 0;
      if (reduce || !target) { el.textContent = target.toFixed(dec); return; }
      var t0 = 0;
      (function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / 700);
        el.textContent = (target * (1 - Math.pow(1 - k, 3))).toFixed(dec);
        if (k < 1) raf(step);
      })(performance.now());
    }
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          runCount(en.target);
          cio.unobserve(en.target);
        });
      }, { threshold: 0.6 });
      document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });
    } else {
      document.querySelectorAll('[data-count]').forEach(runCount);
    }
  }

  /* ── 导航当前区块 ── */
  var navMap = {};
  Array.prototype.forEach.call(navLinks.querySelectorAll('a'), function (a) {
    var sec = document.getElementById(a.getAttribute('href').slice(1));
    if (sec) navMap[sec.id] = a;
  });
  if ('IntersectionObserver' in window) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = navMap[en.target.id];
        if (!a || !en.isIntersecting) return;
        Object.keys(navMap).forEach(function (k) { navMap[k].classList.remove('is-active'); });
        a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navMap).forEach(function (id) { nio.observe(document.getElementById(id)); });
  }

  /* ── 首页还原里的热力图 ── */
  var heat = document.getElementById('heatMock');
  if (heat) {
    var seed = 7;
    var rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 14; c++) {
        var cell = document.createElement('i');
        var v = rnd();
        var lvl = v > 0.86 ? 4 : v > 0.7 ? 3 : v > 0.5 ? 2 : v > 0.32 ? 1 : 0;
        if (lvl) cell.className = 'l' + lvl;
        heat.appendChild(cell);
      }
    }
  }

  /* ── FAQ 手风琴 ── */
  Array.prototype.forEach.call(document.querySelectorAll('.faq-item'), function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') === 'true';
      if (open) {
        a.style.height = a.scrollHeight + 'px';
        raf(function () {
          q.setAttribute('aria-expanded', 'false');
          a.classList.remove('is-open');
          a.style.height = '0px';
        });
      } else {
        q.setAttribute('aria-expanded', 'true');
        a.classList.add('is-open');
        a.style.height = a.scrollHeight + 'px';
        a.addEventListener('transitionend', function done(e) {
          if (e.propertyName !== 'height') return;
          if (q.getAttribute('aria-expanded') === 'true') a.style.height = 'auto';
          a.removeEventListener('transitionend', done);
        });
      }
    });
  });

  /* ── 虚拟开发板示意 ── */
  var SEG = {
    '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd',
    '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', A: 'abcefg', B: 'fgcde',
    C: 'adef', D: 'bcdeg', E: 'adefg', F: 'aefg'
  };
  var seven = document.getElementById('seven');
  if (!seven) return;
  var segEls = Array.prototype.slice.call(seven.querySelectorAll('[data-seg]'));
  var ledEls = Array.prototype.slice.call(document.querySelectorAll('#leds .led'));
  var swBtns = Array.prototype.slice.call(document.querySelectorAll('#sws .sw-cell'));
  var hexOut = document.getElementById('hexOut');
  var verFlow = document.getElementById('verFlow');
  var burnBtn = document.getElementById('burnBtn');
  var guideKnob = document.getElementById('guideKnob');

  var value = 0, draft = 4, loaded = 3, synced = false;

  function paint() {
    var digit = (value & 15).toString(16).toUpperCase();
    var lit = SEG[digit] || '';
    segEls.forEach(function (s) { s.classList.toggle('on', lit.indexOf(s.getAttribute('data-seg')) > -1); });
    for (var b = 0; b < 4; b++) {
      var bit = (value >> b) & 1;
      if (ledEls[b]) ledEls[b].classList.toggle('on', !!bit);
      if (swBtns[b]) {
        swBtns[b].querySelector('.sw').classList.toggle('on', !!bit);
        swBtns[b].setAttribute('aria-pressed', String(!!bit));
      }
    }
    hexOut.textContent = '0x' + digit;
  }
  function paintVersion() {
    if (synced) {
      verFlow.textContent = '✓ 板载 v' + loaded + ' · 与草稿同步';
      burnBtn.textContent = '改一行代码';
    } else {
      verFlow.textContent = '● 草稿 v' + draft + ' ▸ 板载 v' + loaded;
      burnBtn.textContent = '烧录到虚拟板';
    }
  }
  swBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { value ^= (1 << Number(btn.getAttribute('data-i'))); paint(); });
  });
  document.getElementById('clkBtn').addEventListener('click', function () { value = (value + 1) & 15; paint(); });
  document.getElementById('rstBtn').addEventListener('click', function () { value = 0; paint(); });
  burnBtn.addEventListener('click', function () {
    if (synced) { draft = loaded + 1; synced = false; } else { loaded = draft; synced = true; }
    paintVersion();
  });

  /* 引导强度滑杆：拖动即改预览语气 */
  if (guideKnob) {
    var PREVIEW = ['等一下，先说你现在想到哪一步了？', '这一步你先自己试，我在旁边。', '给你半个提示，剩下的你来。', '要不要我直接给出段码表？'];
    var track = guideKnob.parentElement;
    function setGuide(p) {
      p = Math.min(1, Math.max(0, p));
      guideKnob.style.width = (12 + p * 76) + '%';
      var node = document.getElementById('guidePreview');
      if (node) node.firstChild.textContent = PREVIEW[Math.min(PREVIEW.length - 1, Math.floor(p * PREVIEW.length))];
    }
    function fromEvent(e) {
      var r = track.getBoundingClientRect();
      setGuide((e.clientX - r.left) / r.width);
    }
    track.parentElement.addEventListener('pointermove', function (e) {
      if (e.buttons === 1) fromEvent(e);
    });
    track.parentElement.addEventListener('pointerdown', function (e) {
      track.parentElement.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    setGuide(0.24);
  }

  paint();
  paintVersion();
})();


/* ══════════════════════════════════════════════════════════════
   ASCII 字符地形 —— 等高线式，而不是亮度降采样
   四条山脊棱线按局部斜率取字符（- _ \ / |），亮度只靠颜色表达；
   品牌字标走描边 + 极淡内部点画，收进字符场里而不是压在上面。
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var cv = document.querySelector('.terrain-ascii');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');

  var VW = 1440, VH = 560;
  /* 山脊高度场：若干高斯峰叠加。原贝塞尔太平缓，ASCII 读出来只会是横纹。
     crest(x) = base - Σ h·exp(-((x-x0)/w)²)，y 越小越高 */
  var PEAKS = [
    { base: 322, p: [[196,186,148],[566,244,166],[884,158,118],[1188,214,152],[1392,168,124]] },
    { base: 402, p: [[86,158,128],[372,222,152],[648,150,108],[946,206,146],[1268,244,158]] },
    { base: 472, p: [[214,182,142],[524,148,104],[776,212,156],[1078,162,120],[1372,192,140]] },
    { base: 524, p: [[112,118,136],[418,152,150],[700,106,108],[988,142,134],[1318,124,120]] }
  ];
  /* 远→近：主棱线不透明度、两条回波强度、体密度、回波间距、色相 */
  var L = [
    { a: .44, e: [.22, .12], s: .14, g: [40, 96], c: [176,172,240] },
    { a: .56, e: [.28, .15], s: .18, g: [36, 84], c: [104,158,238] },
    { a: .74, e: [.36, .19], s: .22, g: [32, 72], c: [150,206,255] },
    { a: .46, e: [.24, .13], s: .27, g: [28, 60], c: [ 70,126,198] }
  ];

  function crest(i, x) {
    var o = PEAKS[i], y = o.base, k, d;
    for (k = 0; k < o.p.length; k++) {
      d = (x - o.p[k][0]) / o.p[k][2];
      y -= o.p[k][1] * Math.exp(-d * d);
    }
    /* 高频起伏：没有它，棱线在大跨度上近乎水平，ASCII 就退化成横纹 */
    return y + 7 * Math.sin(x * 0.0125 + i * 2.1) + 3.5 * Math.sin(x * 0.031 + i * 1.3);
  }

  function hash2(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }

  /* 斜率感知取字符。cs 是"格内斜率"（每列跨几行），字符格约 1:2.14，
     故视觉 8°/25°/58° 分别对应 cs ≈ .14/.30/.75 —— 直接拿像素斜率判会全错成浅斜。 */
  function lineChar(cs) {
    var a = cs < 0 ? -cs : cs;
    if (a < 0.14) return '-';
    if (a < 0.30) return cs > 0 ? '_' : '\'';
    if (a < 0.75) return cs > 0 ? '\\' : '/';
    return '|';
  }

  var cols = 0, rows = 0, cellW = 7, cellH = 14, mask = null, phase = 0;
  var wmImg = new Image();
  wmImg.onload = function () { buildMask(); render(state.reveal, state.phase); };
  wmImg.src = 'assets/brand/wordmark-reverse.svg';

  function buildMask() {
    if (!cols || !rows || !wmImg.complete) return;
    var off = document.createElement('canvas');
    off.width = cols; off.height = rows;
    var oc = off.getContext('2d');
    oc.fillStyle = '#000'; oc.fillRect(0, 0, cols, rows);
    oc.fillStyle = '#fff';
    var h = rows * 0.80, w = h * (104 / 59);
    if (w > cols * 1.04) { w = cols * 1.04; h = w / (104 / 59); }
    try { oc.drawImage(wmImg, (cols - w) / 2, rows * 0.985 - h, w, h); } catch (e) { return; }
    var d = oc.getImageData(0, 0, cols, rows).data;
    mask = new Float32Array(cols * rows);
    for (var i = 0, n = cols * rows; i < n; i++) mask[i] = d[i * 4] / 255;
  }

  /* 棱线高度查表：贝塞尔只在排版时解一次，逐格只查表，动画才跑得动 */
  var TAB = [[], [], [], []];
  function tabulate() {
    var stepX = VW / cols;
    for (var i = 0; i < 4; i++) {
      var t = TAB[i]; t.length = cols;
      for (var c = 0; c < cols; c++) t[c] = crest(i, (c + .5) * stepX);
    }
  }
  function swell(x) { return 5.5 * Math.sin(x * 0.0085 + phase); }
  /* 第 i 层、偏移 off、第 c 列的棱线所在行（行坐标，可为小数） */
  function rowAt(i, c, off) {
    var v = TAB[i][c < 0 ? 0 : c >= cols ? cols - 1 : c] + off + swell((c + .5) * VW / cols);
    return v / VH * rows;
  }
  function layerAt(c, y) {
    var i, li = -1, top = 0, v;
    for (i = 0; i < 4; i++) { v = TAB[i][c] + swell((c + .5) * VW / cols); if (y >= v) { li = i; top = v; } }
    return { i: li, top: top };
  }

  function layout() {
    var r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var size = r.width < 620 ? 9 : 11;
    ctx.font = '400 ' + size + 'px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    cellW = Math.max(5, ctx.measureText('M').width);
    cellH = size * 1.28;                       /* 行距压到 1.28，纵向采样更密 */
    cols = Math.floor(r.width / cellW);
    rows = Math.floor(r.height / cellH);
    tabulate();
    buildMask();
    return true;
  }

  var state = { reveal: 1, phase: 0 };
  var shownRows = rows;

  function put(ch, c, r, col) {
    if (r < 0 || r >= shownRows) return;
    ctx.fillStyle = col;
    ctx.fillText(ch, (c + .5) * cellW, (r + .5) * cellH);
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }

  function render(rev, ph) {
    if (!cols) return;
    state.reveal = rev; state.phase = ph;
    phase = ph || 0;
    shownRows = rev >= 1 ? rows : Math.max(0, Math.floor(rev * rows));
    ctx.clearRect(0, 0, cv.width, cv.height);

    var cs, i, c, r, x, y, la, k;

    /* 1. 天区与山体点画 */
    var dotCol = 'rgba(150,176,208,0.16)';
    for (r = 0; r < shownRows; r++) {
      y = (r + .5) / rows * VH;
      for (c = 0; c < cols; c++) {
        la = layerAt(c, y);
        var h = hash2(c * 3.7, r * 5.1);
        if (la.i < 0) {
          if (h > .978) put('.', c, r, dotCol);
        } else {
          if (mask && cols >= 120 && mask[r * cols + c] > .30) continue;
          var depth = (y - la.top) / Math.max(60, VH - la.top);
          var dens = L[la.i].s * (1 - .45 * depth);
          if (h < dens) put(h > dens * .5 ? ':' : '.', c, r, rgba(L[la.i].c, .12 + .20 * (1 - depth)));
        }
      }
    }

    /* 2. 每条山脊：主棱线 + 两条回波等高线 */
    for (i = 0; i < 4; i++) {
      for (k = 0; k < 3; k++) {
        var off = k === 0 ? 0 : L[i].g[k - 1];
        var col = rgba(L[i].c, k === 0 ? L[i].a : L[i].e[k - 1]);
        for (c = 0; c < cols; c++) {
          cs = (rowAt(i, c + 1, off) - rowAt(i, c - 1, off)) / 2;
          put(lineChar(cs), c, Math.round(rowAt(i, c, off)) - 1, col);
        }
      }
    }

    /* 3. 品牌字标：按覆盖率取实心字符，靠透明度收在字符场里 */
    if (!mask || cols < 120) return;
    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        var m = mask[r * cols + c];
        if (m < .22) continue;
        put(m > .52 ? '#' : '+', c, r, 'rgba(228,240,255,' + (.14 + .40 * m).toFixed(3) + ')');
      }
    }
  }

  window.XJT = {
    ok: true,
    rows: function () { return rows; },
    cols: function () { return cols; },
    render: function (rev, ph) { if (cols) render(rev, ph); },
    visible: function () { return !!cols; }
  };

  if (layout()) render(1, 0);
  var rt = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (layout()) render(state.reveal, state.phase); }, 160);
  }, { passive: true });
})();
