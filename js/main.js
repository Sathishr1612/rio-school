(function () {
  'use strict';
  document.documentElement.classList.add('js');
  document.getElementById('year').textContent = new Date().getFullYear();
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Mobile menu ----- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', function () { setMenu(false); });
  // keep the closed mobile menu out of the tab order
  var mq = window.matchMedia('(max-width: 899px)');
  function syncInert() { nav.inert = mq.matches && !nav.classList.contains('open'); }
  new MutationObserver(syncInert).observe(nav, { attributes: true, attributeFilter: ['class'] });
  mq.addEventListener('change', syncInert);
  syncInert();

  /* ----- Active nav link on scroll ----- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav ul a'));
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  // sections in page order; the enquiry section counts as "Contact"
  var order = ['home', 'about', 'why', 'course', 'gallery', 'testimonials', 'enquiry', 'contact']
    .map(function (id) { return document.getElementById(id); });
  var alias = { enquiry: 'contact' };
  var ticking = false;
  function updateActive() {
    ticking = false;
    var y = window.scrollY + document.querySelector('.site-header').offsetHeight + window.innerHeight * 0.3;
    var cur = order[0];
    order.forEach(function (s) { if (s && s.getBoundingClientRect().top + window.scrollY <= y) cur = s; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = order[order.length - 1];
    var key = alias[cur.id] || cur.id;
    links.forEach(function (l) { l.classList.toggle('active', l === byId[key]); });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(updateActive); } }, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();

  /* ----- Scroll effects: progress bar, header shadow, parallax ----- */
  (function () {
    var header = document.querySelector('.site-header');
    var moving = [
      ['.blob-lime', -0.07], ['.dots', 0.05], ['.collage-b', -0.05],
      ['.blob-orange', -0.06], ['.s-orange', 0.07], ['.s-blue', -0.06], ['.s-lime', 0.1],
      ['.collage-a img', 0.06], ['.why-photo img', 0.06], ['.course-photo img', 0.05]
    ].map(function (m) { return { el: document.querySelector(m[0]), k: m[1] }; }).filter(function (m) { return m.el; });
    var busy = false;
    function frame() {
      busy = false;
      header.classList.toggle('scrolled', window.scrollY > 10);
      var fab = document.querySelector('.fab');
      if (fab) fab.classList.toggle('show', window.scrollY > 500);
      if (reduce) return;
      var vh = window.innerHeight;
      moving.forEach(function (m) {
        var r = m.el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var off = (r.top + r.height / 2 - vh / 2) * m.k;
        m.el.style.translate = '0 ' + off.toFixed(1) + 'px';
      });
    }
    window.addEventListener('scroll', function () { if (!busy) { busy = true; requestAnimationFrame(frame); } }, { passive: true });
    window.addEventListener('resize', frame);
    frame();
  })();

  /* ----- Scroll reveal (with staggered groups) ----- */
  [['.why-list', 'li'], ['.strip', 'li'], ['.ask', 'li']].forEach(function (g) {
    var box = document.querySelector(g[0]);
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll(g[1]), function (el, i) {
      el.classList.add('reveal');
      el.style.setProperty('--d', (i * 0.12) + 's');
    });
  });
  document.querySelectorAll('.gallery-grid figure').forEach(function (el, i) { el.style.setProperty('--d', (i * 0.1) + 's'); });
  if ('IntersectionObserver' in window) {
    var rev = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rev.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { rev.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ----- Hero carousel (prev / next buttons; gentle autoplay, paused on hover/focus) ----- */
  (function () {
    var hero = document.getElementById('home');
    var slides = hero.querySelectorAll('.slide');
    var i = 0, timer = null;
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle('is-active', k === i);
        s.setAttribute('aria-hidden', k === i ? 'false' : 'true');
      });
    }
    function stop() { clearInterval(timer); timer = null; }
    function start() { stop(); if (!reduce) timer = setInterval(function () { go(i + 1); }, 6000); }
    document.getElementById('hero-prev').addEventListener('click', function () { go(i - 1); start(); });
    document.getElementById('hero-next').addEventListener('click', function () { go(i + 1); start(); });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    go(0); start();
  })();

  /* ----- Testimonial marquee ----- */
  (function () {
    var section = document.getElementById('testimonials');
    document.querySelectorAll('.marquee-track').forEach(function (track) {
      // duplicate the set for a seamless loop; the copy is hidden from assistive tech
      var copy = track.firstElementChild.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      track.appendChild(copy);
    });
    var btn = document.getElementById('t-pause');
    if (reduce) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      var p = section.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', String(p));
      btn.textContent = p ? 'Play' : 'Pause';
    });
  })();

  /* ----- Gallery lightbox ----- */
  (function () {
    var box = document.getElementById('lightbox');
    var img = box.querySelector('img');
    var cap = box.querySelector('.lb-cap');
    if (typeof box.showModal !== 'function') return;
    document.querySelectorAll('.g-open').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.querySelector('img');
        img.src = src.currentSrc || src.src;
        img.alt = src.alt;
        cap.textContent = btn.parentElement.querySelector('figcaption').textContent;
        box.showModal();
      });
    });
    box.querySelector('.lb-close').addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
  })();

  /* ----- Enquiry form ----- */
  // Set to a real form service URL (e.g. Formspree / backend) to enable delivery.
  var FORM_ENDPOINT = '';

  var form = document.getElementById('enquiry-form');
  var status = document.getElementById('form-status');

  function setError(input, msg) {
    var field = input.closest('.field');
    var err = field.querySelector('.error');
    field.classList.toggle('invalid', !!msg);
    err.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    return !msg;
  }

  var rules = {
    name: function (v) { return v.trim().length < 2 ? 'Please enter your full name.' : ''; },
    phone: function (v) {
      var d = v.replace(/[\s\-()]/g, '');
      return /^(\+?91|0)?[6-9]\d{9}$/.test(d) ? '' : 'Please enter a valid 10-digit mobile number.';
    },
    email: function (v) {
      return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address or leave it blank.';
    },
    message: function (v) { return v.trim().length < 5 ? 'Please tell us how we can help.' : ''; }
  };

  Array.prototype.forEach.call(form.elements, function (el) {
    if (!rules[el.name]) return;
    el.addEventListener('blur', function () { setError(el, rules[el.name](el.value)); });
    el.addEventListener('input', function () {
      if (el.closest('.field').classList.contains('invalid')) setError(el, rules[el.name](el.value));
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    var firstBad = null;
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      if (!setError(el, rules[name](el.value)) && !firstBad) firstBad = el;
    });
    if (firstBad) {
      firstBad.focus();
      status.classList.add('err');
      status.textContent = 'Please correct the highlighted fields and try again.';
      return;
    }
    if (!FORM_ENDPOINT) {
      // No backend configured: never claim delivery.
      status.classList.add('ok');
      status.textContent = 'Thank you — your details look good. (Preview mode: this form is not yet connected to Rio, so nothing has been sent.)';
      return;
    }
    status.textContent = 'Sending…';
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        email: form.elements.email.value.trim(),
        message: form.elements.message.value.trim()
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('bad status');
      status.classList.add('ok');
      status.textContent = 'Thank you! Your enquiry has been sent. We will contact you soon.';
      form.reset();
    }).catch(function () {
      status.classList.add('err');
      status.textContent = 'Sorry, something went wrong. Please try again later.';
    });
  });
})();
