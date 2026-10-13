/* 循阶 · 运动层：Lenis 平滑滚动 + GSAP ScrollTrigger / SplitText / ScrambleText
   仅在 GSAP 可用时接管；main.js 中对应的滚动驱动逻辑会自动让位。 */
(function () {
  'use strict';

  var g = window.gsap;
  if (!g) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.documentElement.classList.add('gsap');

  /* 降低动效偏好：只接管可见性，不做任何位移/模糊/解码动画 */
  if (reduce) {
    g.set('.display .ln', { clearProps: 'all' });
    g.set('.reveal', { clearProps: 'all' });
    g.set('.eyebrow-en', { clearProps: 'all' });
    return;
  }

  if (window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);
  var hasSplit = !!window.SplitText;
  if (hasSplit) g.registerPlugin(window.SplitText);
  var hasScramble = !!window.ScrambleTextPlugin;
  if (hasScramble) g.registerPlugin(window.ScrambleTextPlugin);

  var ST = window.ScrollTrigger;
  var lenis = null;

  /* ── 平滑滚动：惯性 + 与 ScrollTrigger 对齐 ── */
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({
      duration: 1.12,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.7
    });
    window.__xjLenis = lenis;
    if (ST) lenis.on('scroll', ST.update);
    g.ticker.add(function (time) { if (lenis) lenis.raf(time * 1000); });
    g.ticker.lagSmoothing(0);

    /* 页内锚点交给 Lenis，避免与原生 smooth 抢滚动 */
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var nav = document.getElementById('nav');
      lenis.scrollTo(el, { offset: -(nav ? nav.offsetHeight : 0) - 18, duration: 1.35 });
    });
  }

  /* ── 标题：SplitText 逐行遮罩上浮（业界所谓 line-mask reveal） ── */
  function lineReveal(el, extra) {
    if (!el) return;
    var st;
    try {
      st = new window.SplitText(el, { split: 'lines,chars', linesClass: 'xj-line', charsClass: 'xj-char', autoSplit: true });
    } catch (err) { return; }
    var lines = st.lines || [];
    if (!lines.length) return;
    g.set(lines, { overflow: 'hidden' });
    g.set(st.chars || [], { yPercent: 112, opacity: 0 });
    g.to(st.chars, {
      yPercent: 0, opacity: 1,
      duration: 1.05, ease: 'expo.out',
      stagger: { each: 0.022, from: 'start' },
      scrollTrigger: extra || { trigger: el, start: 'top 82%', once: true }
    });
  }

  var heroTitle = document.querySelector('.display');
  if (heroTitle) {
    /* 首屏标题保留手工分行 + 薄荷高亮，用逐行遮罩上浮（SplitText 会破坏内联高亮） */
    g.set(heroTitle.querySelectorAll('.ln'), { yPercent: 116, opacity: 0 });
    g.to(heroTitle.querySelectorAll('.ln'), {
      yPercent: 0, opacity: 1, duration: 1.15, ease: 'expo.out', stagger: .12, delay: .1
    });
  }
  if (hasSplit) {
    g.utils.toArray('.section h2, .contact h2').forEach(function (h) {
      lineReveal(h, { trigger: h, start: 'top 86%', once: true });
    });
  } else {
    g.utils.toArray('.section h2, .contact h2').forEach(function (h) {
      g.fromTo(h, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
    });
  }

  /* ── 入场级联：接管 main.js 的 .reveal ── */
  g.utils.toArray('.reveal').forEach(function (el) {
    el.classList.add('in');
    g.fromTo(el,
      { y: 26, opacity: 0, filter: 'blur(7px)' },
      {
        y: 0, opacity: 1, filter: 'blur(0px)',
        duration: 1.0, ease: 'expo.out',
        delay: (parseFloat(el.style.getPropertyValue('--i')) || 0) * 0.055,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
  });

  /* ── 眉标解码：改用 GSAP ScrambleText ── */
  if (hasScramble) {
    g.utils.toArray('.eyebrow-en').forEach(function (el) {
      var final = el.textContent;
      el.textContent = final.replace(/\S/g, '•');
      g.to(el, {
        scrambleText: { text: final, chars: 'upperCase', speed: .34, delimiter: '' },
        duration: .78, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 94%', once: true }
      });
    });
  }

  /* ── 磁吸按钮：quickTo + 弹性回位 ── */
  if (fine) {
    g.utils.toArray('.btn-primary, .btn-solid-light').forEach(function (b) {
      b.classList.add('magnet');
      var xTo = g.quickTo(b, 'x', { duration: .5, ease: 'power3.out' });
      var yTo = g.quickTo(b, 'y', { duration: .5, ease: 'power3.out' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        xTo(((e.clientX - r.left) / r.width - .5) * 12);
        yTo(((e.clientY - r.top) / r.height - .5) * 9 - 1);
      });
      b.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ── 产品外壳：滚动刮擦把透视压平（替代 main.js 的 rAF 版本） ── */
  var tray = document.querySelector('.tray-shell');
  if (tray && ST) {
    g.fromTo(tray,
      { rotateX: 9, scale: .965, y: 40 },
      {
        rotateX: 0, scale: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: '.tray', start: 'top 96%', end: 'top 30%', scrub: 1.1 }
      });
  }

  /* ── 首屏氛围随滚动轻微上浮，制造纵深 ── */
  var atmos = document.querySelector('.hero .atmos');
  if (atmos && ST) {
    g.to(atmos, { yPercent: 14, opacity: .35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ── 数字滚动：expo 缓出 + 取整 ── */
  if (ST) {
    g.utils.toArray('[data-count]').forEach(function (el) {
      var attr = el.getAttribute('data-count') || '';
      var target = parseFloat(attr);
      if (!isFinite(target) || target <= 0) return;
      var dec = attr.indexOf('.') > -1 ? 1 : 0;
      var o = { v: 0 };
      g.set(el, { textContent: '0' });
      g.to(o, {
        v: target, duration: 1.9, ease: 'expo.out',
        onUpdate: function () { el.textContent = o.v.toFixed(dec); },
        onComplete: function () { el.textContent = target.toFixed(dec); },
        scrollTrigger: { trigger: el, start: 'top 94%', once: true }
      });
    });
  }

  /* ── 回流弧与链路：进入视口时描出 ── */
  if (ST) {
    g.fromTo('.lb-path', { clipPath: 'inset(0 0 100% 0)' }, {
      clipPath: 'inset(0 0 0 0)', duration: 1.2, ease: 'power2.inOut',
      scrollTrigger: { trigger: '.loopback', start: 'top 88%', once: true }
    });
  }

  /* ── 开场幕布：三片收起后自毁 ── */
  var curtain = document.querySelector('.curtain');
  if (curtain) {
    var dropCurtain = function () {
      if (!curtain.parentNode) return;
      curtain.classList.add('is-out');
      setTimeout(function () {
        if (curtain.parentNode) curtain.parentNode.removeChild(curtain);
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, 1150);
    };
    requestAnimationFrame(dropCurtain);
    setTimeout(dropCurtain, 400); /* rAF 未触发也要收幕，绝不长期遮挡内容 */
  }

  /* ── 边框流光挂载：首屏外壳与画像卡 ── */
  ['.tray-shell', '.hero-aside'].forEach(function (sel) {
    var el = document.querySelector(sel);
    if (el) el.classList.add('beam');
  });

  /* ── 3D 斜视 + 高光跟随：还原界面卡、bento、拓扑节点 ── */
  if (fine) {
    g.utils.toArray('.cap-stage, .bcell, .arch-col, .log-c').forEach(function (el) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      var glare = document.createElement('span');
      glare.className = 'tilt-glare';
      el.appendChild(glare);
      el.classList.add('tilt');
      var rx = g.quickTo(el, 'rotateX', { duration: .6, ease: 'power3.out' });
      var ry = g.quickTo(el, 'rotateY', { duration: .6, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width;
        var ny = (e.clientY - r.top) / r.height;
        rx((.5 - ny) * 4.5);
        ry((nx - .5) * 5.5);
        el.style.setProperty('--gx', (nx * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (ny * 100).toFixed(1) + '%');
      }, { passive: true });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  /* ── 页脚 ASCII 地形：逐行打印式揭幕 + 缓慢相位漂移 + 视差 ── */
  if (ST && window.XJT && window.XJT.ok) {
    var terrain = document.querySelector('.terrain');
    var pr = { v: 0 };   /* 打印进度 */
    var ph = { v: 0 };   /* 地形起伏相位 */
    var onScreen = false, acc = 999;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { onScreen = e.isIntersecting; });
      }, { rootMargin: '140px' }).observe(terrain);
    } else { onScreen = true; }

    window.XJT.render(0, 0);
    /* 字符场重绘代价高，11fps 足够，且离屏即停 */
    g.ticker.add(function (time, dt) {
      acc += dt;
      if (!onScreen || acc < 88) return;
      acc = 0;
      window.XJT.render(pr.v, ph.v);
    });
    g.to(pr, {
      v: 1, duration: 1.7, ease: 'none',
      scrollTrigger: { trigger: terrain, start: 'top 82%', once: true }
    });
    g.to(ph, { v: Math.PI * 2, duration: 54, ease: 'none', repeat: -1 });
    g.fromTo('.terrain-ascii', { y: 26 }, {
      y: -26, ease: 'none',
      scrollTrigger: { trigger: terrain, start: 'top bottom', end: 'bottom bottom', scrub: 1 }
    });
  }

  if (ST) {
    var refreshOnLoad = function () { ST.refresh(); };
    window.addEventListener('load', refreshOnLoad);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    window.addEventListener('resize', function () { if (ST) ST.refresh(); });
  }
})();
