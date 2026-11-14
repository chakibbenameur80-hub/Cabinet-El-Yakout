(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const lang = document.documentElement.lang;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  /* Language gate on "/" (other hosts; Vercel redirects before this). */
  if (document.body.hasAttribute('data-root')) {
    const saved = store.get('ey-lang');
    const pref = saved || ((navigator.language || 'fr').toLowerCase().startsWith('ar') ? 'ar' : 'fr');
    location.replace(`/${pref === 'ar' ? 'ar' : 'fr'}/`);
    return;
  }

  /* Remember the chosen language. */
  $$('[data-lang]').forEach((a) => a.addEventListener('click', () => store.set('ey-lang', a.dataset.lang)));
  store.set('ey-lang', lang);

  $$('[data-year]').forEach((n) => (n.textContent = new Date().getFullYear()));

  /* Header border once scrolled. */
  const header = $('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  }

  /* On the home page the mobile dock appears once the hero buttons scroll away. */
  const dock = $('[data-dock]');
  const heroActions = $('.hero .actions');
  if (dock && heroActions && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => dock.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(heroActions);
  }

  /* Mobile menu with focus trap. */
  const menu = $('[data-menu]');
  const openBtn = $('[data-menu-open]');
  if (menu && openBtn) {
    const focusables = () => $$('a[href], button:not([disabled])', menu);
    const open = () => {
      menu.hidden = false;
      void menu.offsetWidth;
      menu.classList.add('is-open');
      document.body.classList.add('menu-lock');
      openBtn.setAttribute('aria-expanded', 'true');
      $('[data-menu-close]', menu).focus();
    };
    const close = () => {
      menu.classList.remove('is-open');
      document.body.classList.remove('menu-lock');
      openBtn.setAttribute('aria-expanded', 'false');
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 380);
      openBtn.focus();
    };
    openBtn.addEventListener('click', open);
    $('[data-menu-close]', menu).addEventListener('click', close);
    $$('a', menu).forEach((a) => a.addEventListener('click', () => {
      menu.classList.remove('is-open');
      document.body.classList.remove('menu-lock');
    }));
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') return close();
      if (e.key !== 'Tab') return;
      const f = focusables();
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    matchMedia('(min-width: 1021px)').addEventListener('change', (m) => {
      if (m.matches && !menu.hidden) { menu.classList.remove('is-open'); menu.hidden = true; document.body.classList.remove('menu-lock'); }
    });
  }

  /* Reveal a few images on scroll. The wrapper is observed, because a fully
     clipped element can report zero intersection. */
  const reveals = $$('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) reveals.forEach((r) => r.classList.add('is-in'));
    else {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.querySelector('.reveal').classList.add('is-in'); io.unobserve(e.target); }
      }), { threshold: 0.2 });
      reveals.forEach((r) => io.observe(r.parentElement));
    }
  }

  /* Lightbox. */
  const lb = $('[data-lightbox]');
  if (lb) {
    const btns = $$('[data-lightbox-index]');
    const img = $('[data-lb-img]', lb);
    const cap = $('[data-lb-caption]', lb);
    const count = $('[data-lb-count]', lb);
    const tpl = lb.dataset.counter;
    let i = 0, opener = null;
    const show = (n) => {
      i = (n + btns.length) % btns.length;
      const d = btns[i].dataset;
      img.style.transition = ''; img.style.transform = '';
      img.src = d.full; img.width = d.w; img.height = d.h; img.alt = d.alt;
      cap.textContent = d.caption;
      count.textContent = tpl.replace('{n}', i + 1).replace('{total}', btns.length);
    };
    btns.forEach((b, n) => b.addEventListener('click', () => {
      opener = b; show(n);
      if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    }));
    const close = () => (lb.close ? lb.close() : lb.removeAttribute('open'));
    $('[data-lb-close]', lb).addEventListener('click', close);
    $('[data-lb-prev]', lb).addEventListener('click', () => show(i - 1));
    $('[data-lb-next]', lb).addEventListener('click', () => show(i + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); });
    lb.addEventListener('close', () => opener && opener.focus());
    lb.addEventListener('keydown', (e) => {
      const rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowRight') show(i + (rtl ? -1 : 1));
      if (e.key === 'ArrowLeft') show(i + (rtl ? 1 : -1));
    });

    /* Touch swipe. Pointer events with touch-action: pan-y, so vertical gestures
       stay with the browser and only a clearly horizontal drag is ours. The
       content follows the finger: in LTR a swipe to the left shows the next
       photo, in RTL a swipe to the right does. Mouse input is ignored. */
    const fig = $('.lb-fig', lb);
    const isRtl = () => document.documentElement.dir === 'rtl';
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const LOCK_DISTANCE = 10;   // px before the gesture is classified
    const AXIS_RATIO = 1.2;     // horizontal must clearly beat vertical
    const MIN_DISTANCE = 60;    // px, or 18% of the width, for a deliberate swipe
    const FLICK_DISTANCE = 35;  // a short but fast flick also counts
    const FLICK_SPEED = 0.5;    // px per ms
    let drag = null;
    let suppressUntil = 0;

    const settle = (animate) => {
      img.getAnimations().forEach((a) => a.cancel());
      if (animate && !reduceMotion.matches && img.style.transform) {
        img.style.transition = 'transform 0.25s cubic-bezier(0.22, 0.8, 0.24, 1)';
        img.style.transform = '';
        setTimeout(() => { img.style.transition = ''; }, 280);
      } else {
        img.style.transition = '';
        img.style.transform = '';
      }
    };
    const release = () => {
      if (drag && drag.captured) { try { fig.releasePointerCapture(drag.id); } catch { /* already released */ } }
      drag = null;
    };
    const abort = () => { if (drag) { release(); settle(true); } };

    fig.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      if (!e.isPrimary) { if (drag) drag.dead = true; return; } // second finger: not a swipe
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), axis: null, dead: false, captured: false };
    });
    fig.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id || drag.dead) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.axis) {
        if (Math.hypot(dx, dy) < LOCK_DISTANCE) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) * AXIS_RATIO ? 'x' : 'y';
        if (drag.axis === 'x') { try { fig.setPointerCapture(e.pointerId); drag.captured = true; } catch { /* ignore */ } }
      }
      if (drag.axis === 'x') {
        img.style.transition = 'none';
        img.style.transform = `translateX(${dx * 0.6}px)`;
      }
    });
    fig.addEventListener('pointerup', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      release();
      if (d.dead || d.axis !== 'x') { settle(true); return; }
      const dx = e.clientX - d.x;
      const speed = Math.abs(dx) / Math.max(1, performance.now() - d.t);
      const width = fig.getBoundingClientRect().width || innerWidth;
      const deliberate = Math.abs(dx) >= Math.max(MIN_DISTANCE, width * 0.18);
      const flick = Math.abs(dx) >= FLICK_DISTANCE && speed >= FLICK_SPEED;
      suppressUntil = performance.now() + 350; // swallow the click some browsers add after a drag
      if (!deliberate && !flick) { settle(true); return; }
      const next = (dx < 0) !== isRtl();
      settle(false);
      show(i + (next ? 1 : -1));
      if (!reduceMotion.matches) {
        img.animate(
          [{ transform: `translateX(${dx < 0 ? 48 : -48}px)`, opacity: 0.35 }, { transform: 'none', opacity: 1 }],
          { duration: 280, easing: 'cubic-bezier(0.22, 0.8, 0.24, 1)' },
        );
      }
    });
    fig.addEventListener('pointercancel', (e) => { if (drag && e.pointerId === drag.id) abort(); });
    // Touch pointers are implicitly captured by the image; moving capture to the
    // figure fires a lostpointercapture on the image that bubbles here. Only a
    // loss of the figure's own capture means the gesture was taken away.
    fig.addEventListener('lostpointercapture', (e) => { if (e.target === fig && drag && e.pointerId === drag.id) abort(); });
    lb.addEventListener('close', () => { drag = null; settle(false); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) abort(); });
    lb.addEventListener('click', (e) => {
      if (performance.now() < suppressUntil) { e.stopImmediatePropagation(); e.preventDefault(); }
    }, true);
  }

  /* Appointment form → WhatsApp message. */
  const form = $('[data-booking-form]');
  if (form) {
    const data = JSON.parse($('[data-i18n]').textContent);
    const card = $('[data-form-card]');
    const done = $('[data-done]');
    const summary = $('[data-summary]');
    const list = $('[data-summary-list]', summary);
    const preview = $('[data-preview]', done);
    const waBtn = $('[data-wa]', done);
    const status = $('[data-copy-status]', done);
    const dateInput = $('[data-date]', form);

    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = iso(new Date());
    dateInput.min = today;

    const rules = {
      name: (f) => f.name.value.trim().length >= 2,
      phone: (f) => /^\+?\d{8,15}$/.test(f.phone.value.replace(/[\s.\-()]/g, '')),
      reason: (f) => f.reason.value !== '',
      date: (f) => !f.date.value || f.date.value >= today,
      consent: (f) => f.consent.checked,
    };
    const inputOf = { name: '#f-name', phone: '#f-phone', reason: '#f-reason', date: '#f-date', consent: '#f-consent' };

    const setError = (key, bad) => {
      const field = $(`[data-field="${key}"]`, form);
      const msg = $(`#err-${key}`, form);
      const input = $(inputOf[key], form);
      field.classList.toggle('has-error', bad);
      msg.hidden = !bad;
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    };

    const validate = () => {
      const bad = Object.keys(rules).filter((k) => !rules[k](form));
      Object.keys(rules).forEach((k) => setError(k, bad.includes(k)));
      return bad;
    };

    // Clear an error as soon as the field becomes valid.
    Object.keys(rules).forEach((k) => {
      const el = $(inputOf[k], form);
      ['input', 'change'].forEach((ev) => el.addEventListener(ev, () => {
        if ($(`[data-field="${k}"]`, form).classList.contains('has-error') && rules[k](form)) setError(k, false);
      }));
    });

    const buildMessage = () => {
      const m = data.msg;
      const v = (n) => form[n].value.trim();
      const when = form.date.value
        ? new Intl.DateTimeFormat(m.dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            .format(new Date(`${form.date.value}T12:00:00`))
        : m.none;
      const time = data.times[Number(form.time.value)];
      const lines = [
        m.intro, '',
        `${m.name} : ${v('name')}`,
        `${m.phone} : ${v('phone')}`,
        `${m.reason} : ${data.reasons[Number(form.reason.value)]}`,
        `${m.date} : ${when}`,
        `${m.time} : ${time}`,
      ];
      if (v('message')) lines.push(`${m.message} : ${v('message')}`);
      lines.push('', m.outro);
      return lines.join('\n').replace(/\u00A0/g, ' ');
    };

    let message = '';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = validate();
      if (bad.length) {
        list.replaceChildren(...bad.map((k) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = inputOf[k];
          a.textContent = $(`#err-${k}`, form).textContent;
          a.addEventListener('click', (ev) => { ev.preventDefault(); $(inputOf[k], form).focus(); });
          li.append(a);
          return li;
        }));
        summary.hidden = false;
        summary.focus();
        return;
      }
      summary.hidden = true;
      message = buildMessage();
      const url = `https://wa.me/${data.wa}?text=${encodeURIComponent(message)}`;
      preview.textContent = message;
      waBtn.href = url;
      status.textContent = '';
      card.hidden = true;
      done.hidden = false;
      done.scrollIntoView({ block: 'start' });
      done.focus({ preventScroll: true });
      // Opened from the user's own submit; if a popup blocker stops it, the button stays.
      window.open(url, '_blank', 'noopener');
    });

    $('[data-edit]', done).addEventListener('click', () => {
      done.hidden = true; card.hidden = false;
      card.scrollIntoView({ block: 'start' });
      $('#f-name').focus({ preventScroll: true });
    });

    $('[data-copy]', done).addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(message);
        status.textContent = data.copied;
      } catch {
        const r = document.createRange();
        r.selectNodeContents(preview);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        status.textContent = data.copyFail;
      }
    });
  }
})();
