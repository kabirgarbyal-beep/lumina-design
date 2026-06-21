/* ========== ATELIER NOIR — interactions ========== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Loader ---------- */
  const loader = $('#loader');
  const loaderBar = $('.loader__bar span');
  const loaderCount = $('#loaderCount');
  let p = 0;
  const tick = () => {
    p += Math.random() * 9 + 4;
    if (p >= 100) p = 100;
    loaderBar.style.width = p + '%';
    loaderCount.textContent = Math.floor(p);
    if (p < 100) setTimeout(tick, 90);
    else {
      setTimeout(() => {
        loader.classList.add('hide');
        document.body.classList.add('loaded');
        $('.hero').classList.add('ready');
        kickReveals();
      }, 300);
    }
  };
  window.addEventListener('load', tick);

  /* ---------- Custom cursor ---------- */
  const cur = $('#cursor');
  const dot = $('#cursorDot');
  let cx = 0, cy = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = `translate(${tx}px,${ty}px) translate(-50%,-50%)`;
  });
  const lerp = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
    requestAnimationFrame(lerp);
  };
  lerp();
  $$('a, button, .compare, .project').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cur.classList.remove('is-hover'));
  });

  /* ---------- Scroll progress + nav ---------- */
  const sp = $('#scrollProgress');
  const nav = $('#nav');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    sp.style.width = (y / h) * 100 + '%';
    nav.classList.toggle('is-solid', y > 60);
    if (y > 200 && y > lastY + 6) nav.classList.add('is-hidden');
    else if (y < lastY - 6) nav.classList.remove('is-hidden');
    lastY = y;

    // hero parallax
    const heroImg = $('#heroImg');
    if (heroImg && y < innerHeight) {
      heroImg.style.transform = `scale(1.08) translateY(${y * 0.25}px)`;
    }
  };
  document.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger');
  const menu = $('#menu');
  burger?.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    menu.classList.toggle('is-open');
  });
  $$('#menu a').forEach((a, i) => {
    a.style.setProperty('--i', i);
    a.addEventListener('click', () => {
      burger.classList.remove('is-open');
      menu.classList.remove('is-open');
    });
  });

  /* ---------- Split words for headlines ---------- */
  $$('.reveal-words').forEach(el => {
    const text = el.innerHTML;
    // preserve <em> tags by splitting safely
    const tmp = document.createElement('div');
    tmp.innerHTML = text;
    const walk = node => {
      const out = [];
      node.childNodes.forEach(n => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(w => {
            if (!w.trim()) out.push(document.createTextNode(' '));
            else {
              const wrap = document.createElement('span');
              wrap.className = 'word';
              const inner = document.createElement('span');
              inner.textContent = w;
              wrap.appendChild(inner);
              out.push(wrap);
            }
          });
        } else if (n.nodeType === 1) {
          const clone = n.cloneNode(false);
          const inner = walk(n);
          // wrap em as word too
          const wrap = document.createElement('span');
          wrap.className = 'word';
          inner.forEach(c => clone.appendChild(c));
          wrap.appendChild(clone);
          out.push(wrap);
        }
      });
      return out;
    };
    el.innerHTML = '';
    walk(tmp).forEach(c => el.appendChild(c));
    // wrap em's text inside translated span
    $$('.word > em', el).forEach(em => {
      const t = em.textContent;
      em.innerHTML = `<span style="display:inline-block;transform:translateY(110%);transition:transform .9s cubic-bezier(.16,1,.3,1)">${t}</span>`;
    });
  });

  /* ---------- Reveal observer ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        // animate em inner too
        $$('.word > em > span', en.target).forEach(s => s.style.transform = 'translateY(0)');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  const kickReveals = () => {
    $$('.reveal-up, .reveal-words, .reveal-project, .process__row').forEach(el => io.observe(el));
  };

  /* ---------- Counters ---------- */
  const counterIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const end = +el.dataset.count;
      const dur = 1600;
      const t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.floor(end * e);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(el => counterIO.observe(el));

  /* ---------- Smooth anchor with offset ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + window.scrollY - 40;
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Before / After slider ---------- */
  const compare = $('#compare');
  const clip = $('#compareClip');
  const handle = $('#compareHandle');
  let dragging = false;

  const setPos = (pct) => {
    pct = Math.max(2, Math.min(98, pct));
    clip.style.width = pct + '%';
    handle.style.left = pct + '%';
  };
  const fromEvent = e => {
    const r = compare.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    setPos((x / r.width) * 100);
  };
  const start = e => { dragging = true; cur?.classList.add('is-drag'); fromEvent(e); };
  const move = e => { if (dragging) fromEvent(e); };
  const end = () => { dragging = false; cur?.classList.remove('is-drag'); };

  compare.addEventListener('mousedown', start);
  compare.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('mousemove', move);
  window.addEventListener('touchmove', move, { passive: true });
  window.addEventListener('mouseup', end);
  window.addEventListener('touchend', end);

  // auto teaser
  let teased = false;
  const teaseIO = new IntersectionObserver(es => {
    es.forEach(en => {
      if (en.isIntersecting && !teased) {
        teased = true;
        let v = 50, dir = 1, frames = 0;
        const loop = () => {
          v += dir * 0.6;
          if (v > 68) dir = -1;
          if (v < 32) dir = 1;
          setPos(v);
          frames++;
          if (frames < 180 && !dragging) requestAnimationFrame(loop);
          else setPos(50);
        };
        loop();
      }
    });
  }, { threshold: 0.4 });
  teaseIO.observe(compare);

  /* ---------- Golden cursor trail (curvy SVG path) ---------- */
  if (!prefersReduced && matchMedia('(hover:hover)').matches) {
    const trail = $('#trail');
    const path  = $('#trailPath');
    const pts   = [];
    const MAX   = 22;       // number of points kept
    const SMOOTH= 0.22;     // follow easing
    let mx = innerWidth/2, my = innerHeight/2;
    let px = mx, py = my;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    const sizeSvg = () => { trail.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`); };
    sizeSvg();
    addEventListener('resize', sizeSvg);

    const draw = () => {
      // ease the lead point so the curve trails behind the cursor
      px += (mx - px) * SMOOTH;
      py += (my - py) * SMOOTH;
      pts.push({x: px, y: py});
      if (pts.length > MAX) pts.shift();

      if (pts.length > 2) {
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i+1].x) / 2;
          const yc = (pts[i].y + pts[i+1].y) / 2;
          d += ` Q ${pts[i].x} ${pts[i].y} ${xc} ${yc}`;
        }
        path.setAttribute('d', d);
      }
      requestAnimationFrame(draw);
    };
    draw();
  }

})();