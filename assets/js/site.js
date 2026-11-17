(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k, s = localStorage) { try { return s.getItem(k); } catch (e) { return null; } }, set(k, v, s = localStorage) { try { s.setItem(k, v); } catch (e) {} } };

  /* ---- açılış kuklası ---- */
  const ld = $('#loader');
  if (ld && !document.documentElement.classList.contains('seen')) {
    const t0 = performance.now();
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true;
      const wait = Math.max(0, 1400 - (performance.now() - t0));
      setTimeout(() => {
        ld.classList.add('bow', 'close');
        setTimeout(() => { ld.classList.add('open'); setTimeout(() => ld.classList.add('done'), 950); }, 700);
      }, reduce ? 0 : wait);
    };
    store.set('siba-ld', '1', sessionStorage);
    if (document.readyState === 'complete') finish(); else addEventListener('load', finish);
    setTimeout(finish, 20000); /* yavaş bağlantıda sayfa yüklenene kadar kukla oynar; en fazla 20 sn */
  }

  /* ---- menü ---- */
  const top = $('#top');
  if (top) {
    addEventListener('scroll', () => top.classList.toggle('lined', scrollY > 8), { passive: true });
    const bg = $('[data-burger]');
    bg && bg.addEventListener('click', () => { const o = top.classList.toggle('menu'); bg.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });
    $$('.dd>button').forEach(b => b.addEventListener('click', e => {
      const dd = b.parentElement, o = !dd.classList.contains('open');
      $$('.dd.open').forEach(x => { if (x !== dd) { x.classList.remove('open'); x.firstElementChild.setAttribute('aria-expanded', 'false'); } });
      dd.classList.toggle('open', o); b.setAttribute('aria-expanded', o); e.stopPropagation();
    }));
    document.addEventListener('click', e => { if (!e.target.closest('.dd')) $$('.dd.open').forEach(x => { x.classList.remove('open'); x.firstElementChild.setAttribute('aria-expanded', 'false'); }); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { $$('.dd.open').forEach(x => x.classList.remove('open')); top.classList.remove('menu'); document.body.style.overflow = ''; } });
  }

  /* ---- gece / gündüz ---- */
  const tb = $('[data-theme-btn]');
  tb && tb.addEventListener('click', () => {
    const h = document.documentElement, n = h.dataset.theme === 'day' ? 'night' : 'day';
    h.dataset.theme = n; store.set('siba-tema', n);
    tb.setAttribute('aria-label', n === 'day' ? 'Gece temasına geç' : 'Gündüz temasına geç');
  });

  /* ---- kayan hizmet şeridi ---- */
  $$('[data-rail]').forEach(rail => {
    const track = rail.firstElementChild;
    let paused = false, drag = null, last = performance.now(), pos = 0;
    const half = () => track.scrollWidth / 2;
    const tick = now => {
      const dt = Math.min(64, now - last); last = now;
      if (!paused && !drag && !reduce) { pos += dt * 0.045; if (pos >= half()) pos -= half(); rail.scrollLeft = pos; }
      requestAnimationFrame(tick);
    };
    rail.addEventListener('mouseenter', () => paused = true);
    rail.addEventListener('mouseleave', () => { paused = false; pos = rail.scrollLeft; });
    rail.addEventListener('focusin', () => paused = true);
    rail.addEventListener('focusout', () => { paused = false; pos = rail.scrollLeft; });
    rail.addEventListener('touchstart', () => { paused = true; }, { passive: true });
    rail.addEventListener('touchend', () => setTimeout(() => { paused = false; pos = rail.scrollLeft % half(); }, 1800), { passive: true });
    rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; drag = { x: e.clientX, s: rail.scrollLeft, moved: false }; rail.classList.add('drag'); });
    addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true; let s = drag.s - dx; if (s < 0) s += half(); if (s > half()) s -= half(); rail.scrollLeft = s; });
    addEventListener('pointerup', () => { if (!drag) return; const moved = drag.moved; pos = rail.scrollLeft; drag = null; rail.classList.remove('drag'); if (moved) { const stop = ev => { ev.preventDefault(); ev.stopPropagation(); }; rail.addEventListener('click', stop, { capture: true, once: true }); } });
    rail.addEventListener('scroll', () => { if (paused && !drag) pos = rail.scrollLeft; }, { passive: true });
    requestAnimationFrame(tick);
  });

  /* ---- "bugün sahnede" tabelası ---- */
  const board = $('[data-board]');
  if (board && !reduce) {
    let L = []; try { L = JSON.parse(board.dataset.board); } catch (e) {}
    let i = 0;
    if (L.length > 1) setInterval(() => { board.classList.add('swap'); setTimeout(() => { i = (i + 1) % L.length; board.textContent = L[i]; board.classList.remove('swap'); }, 320); }, 2300);
  }

  /* ---- konuşan kuklalar ---- */
  const scene = $('[data-scene]'), bubble = $('[data-bubble]');
  if (scene && bubble) {
    let lines = { a: [], b: [] }; try { lines = JSON.parse($('#puppet-lines').textContent); } catch (e) {}
    const idx = { a: 0, b: 0 }; let hideT;
    const talk = hit => {
      const who = hit.dataset.pup, L = lines[who] || []; if (!L.length) return;
      bubble.textContent = L[idx[who]++ % L.length];
      const sr = scene.getBoundingClientRect(), pr = hit.getBoundingClientRect();
      const bw = Math.min(280, sr.width * .6);
      let left = pr.left - sr.left + pr.width / 2 - 40; left = Math.max(6, Math.min(sr.width - bw - 6, left));
      bubble.style.left = left + 'px'; bubble.style.top = Math.max(0, pr.top - sr.top - 70) + 'px';
      bubble.style.setProperty('--tail', Math.max(16, Math.min(bw - 30, pr.left - sr.left + pr.width / 2 - left - 9)) + 'px');
      bubble.classList.remove('on'); void bubble.offsetWidth; bubble.classList.add('on');
      $$('.pup-hit', scene).forEach(x => x.classList.toggle('talk', x === hit));
      clearTimeout(hideT); hideT = setTimeout(() => { bubble.classList.remove('on'); hit.classList.remove('talk'); }, 4200);
      const hint = $('.scene-hint', scene); hint && hint.remove();
    };
    $$('.pup-hit', scene).forEach(p => p.addEventListener('click', () => talk(p)));
    setTimeout(() => { const r = scene.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0 && !bubble.classList.contains('on')) talk($('.pup-hit', scene)); }, document.documentElement.classList.contains('seen') ? 1200 : 3600);
  }

  /* ---- kaçan balonlar ---- */
  const bls = $$('.balloons');
  if (bls.length && matchMedia('(hover:hover)').matches && !reduce) {
    addEventListener('pointermove', e => {
      bls.forEach(b => {
        const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 3;
        const dx = cx - e.clientX, dy = cy - e.clientY, d = Math.hypot(dx, dy);
        if (d < 160) { const k = (160 - d) / 160 * 60; b.style.transform = `translate(${dx / d * k}px,${dy / d * k}px)`; }
        else if (b.style.transform) b.style.transform = '';
      });
    }, { passive: true });
  }

  /* ---- konfeti ---- */
  const confetti = (x, y) => {
    if (reduce) return;
    const cs = ['#FFC531', '#FF6FA0', '#A43FD0', '#FFF6EC', '#D3263A', '#25D366'];
    for (let i = 0; i < 26; i++) {
      const d = document.createElement('i'); d.className = 'confetti';
      d.style.background = cs[i % cs.length]; d.style.left = x + 'px'; d.style.top = y + 'px';
      if (i % 3 === 0) d.style.borderRadius = '50%';
      document.body.appendChild(d);
      const a = Math.random() * Math.PI * 2, v = 70 + Math.random() * 130;
      d.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * v}px,${Math.sin(a) * v - 40}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: .5 }, { transform: `translate(${Math.cos(a) * v * 1.2}px,${Math.sin(a) * v + 140}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => d.remove();
    }
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-confetti]'); if (b) confetti(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2); });

  /* ---- perde açılışı ile beliren bölümler ---- */
  $$('.plan-in, .cta-in, .mosaic>a').forEach(el => el.classList.add('curtain', 'reveal'));
  const rv = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('in'));

  /* ---- ışık kutusu ---- */
  const lbs = $$('[data-lb]');
  if (lbs.length) {
    const box = document.createElement('div'); box.className = 'lb'; box.hidden = true;
    box.innerHTML = '<img alt=""><button type="button" aria-label="Kapat">×</button>';
    document.body.appendChild(box);
    const close = () => { box.hidden = true; };
    box.addEventListener('click', e => { if (e.target !== box.querySelector('img')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    lbs.forEach(a => a.addEventListener('click', e => { e.preventDefault(); const im = a.querySelector('img'); box.querySelector('img').src = a.href; box.querySelector('img').alt = im ? im.alt : ''; box.hidden = false; box.querySelector('button').focus(); }));
  }

  /* ---- talep gönderimi ---- */
  const send = async () => { throw new Error('whatsapp'); }; // talepler doğrudan WhatsApp'a gider

  /* ---- hızlı mesaj ---- */
  const qf = $('[data-quick]');
  qf && qf.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(qf), note = $('[data-note]', qf), btn = qf.querySelector('button');
    const p = { kind: 'mesaj', ad: f.get('ad'), tel: f.get('tel'), mesaj: f.get('mesaj'), web: f.get('web') };
    btn.disabled = true; note.textContent = 'Hazırlanıyor…';
    try { const j = await send(p); note.textContent = `Talep no #${j.no}. WhatsApp açılıyor…`; location.href = j.wa; }
    catch (err) { note.textContent = 'WhatsApp açılıyor…'; location.href = 'https://wa.me/' + (qf.dataset.wa || '905432331680') + '?text=' + encodeURIComponent(`Merhaba Siba Organizasyon, web sitenizden ulaşıyorum.\n${p.mesaj}\n\n👤 ${p.ad}\n📞 ${p.tel}`); }
    finally { btn.disabled = false; }
  });

  /* ---- planlayıcı ---- */
  const pl = $('[data-planner]');
  if (pl) {
    const D = JSON.parse($('#planner-data').textContent);
    const steps = $$('.pl-step', pl), dots = $$('.pl-steps li', pl);
    const prev = $('[data-prev]', pl), next = $('[data-next]', pl), sub = $('[data-submit]', pl), err = $('[data-err]', pl);
    const cbox = $('[data-concepts]', pl), calcEl = $('[data-calc]', pl), sumEl = $('[data-summary]', pl);
    let cur = 0;
    const val = n => { const el = pl.elements[n]; if (!el) return ''; if (el instanceof RadioNodeList) return el.value; return el.value; };
    const checked = n => $$(`[name="${n}"]:checked`, pl).map(x => x.value);
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const qs = new URLSearchParams(location.search);

    const renderConcepts = () => {
      const tur = val('tur'), keep = val('konsept');
      const list = D.concepts.filter(c => !tur || c.service === tur);
      const all = list.length ? list : D.concepts;
      cbox.innerHTML = all.map(c => `<label><input type="radio" name="konsept" value="${esc(c.slug)}"><span><img src="${esc(c.img)}" alt="" loading="lazy"><em><b>${esc(c.name)}</b><small>${esc(c.tag)}</small></em></span></label>`).join('')
        + `<label><input type="radio" name="konsept" value="ozel"><span><i class="own">+</i><em><b>Kendi konseptim</b><small>Fikrimi anlatacağım</small></em></span></label>`
        + `<label><input type="radio" name="konsept" value=""><span><i class="own">?</i><em><b>Fark etmez</b><small>Siz önerin</small></em></span></label>`;
      const want = keep || qs.get('konsept') || '';
      const r = $$('[name="konsept"]', cbox).find(x => x.value === want) || $$('[name="konsept"]', cbox).pop();
      r.checked = true;
    };
    const calc = () => {
      const g = Math.max(0, Math.min(5000, +val('misafir') || 0)), k = Math.max(0, Math.min(g || 5000, +val('cocuk') || 0));
      const ex = checked('ekstra'), venue = val('mekan'), o = [];
      if (ex.includes('masa') || ['Bahçe', 'Açık alan / meydan', 'Ev'].includes(venue)) { o.push(['Masa (8 kişilik)', Math.ceil(g / 8)]); o.push(['Sandalye', g]); }
      if (ex.includes('pamuk')) o.push(['Pamuk şeker (porsiyon)', k > 0 ? k * 2 : g]);
      if (ex.includes('popcorn')) o.push(['Popcorn (kese)', k > 0 ? k * 2 : g]);
      if (ex.includes('sisme')) { const n = k || Math.round(g / 3); o.push(['Şişme park', n <= 15 ? '1 küçük (3×3 m)' : n <= 40 ? '1 orta (4×5 m)' : Math.ceil(n / 40) + ' büyük (5×7 m)']); }
      if (ex.includes('kukla')) o.push(['Kukla gösterisi', k > 60 ? '2 seans' : '1 seans (≈40 dk)']);
      if (ex.includes('ses')) o.push(['Ses sistemi', g > 150 ? 'Büyük sistem + mikrofon' : 'Standart sistem + mikrofon']);
      if (ex.includes('led')) o.push(['LED ekran', g > 300 ? 'Geniş ekran, 5 mm' : 'Sahne ekranı, 3 mm']);
      if (ex.includes('ceviri')) o.push(['Çeviri kulaklığı', g]);
      calcEl.innerHTML = o.length ? o.map(x => `<div><span>${esc(x[0])}</span><b>${esc(x[1])}</b></div>`).join('') : '<p class="none">Misafir sayısını ve ekstraları seçtikçe ihtiyaç listeniz burada oluşacak.</p>';
      return o;
    };
    const summary = () => {
      const t = D.types.find(x => x.slug === val('tur')), c = D.concepts.find(x => x.slug === val('konsept'));
      const exN = checked('ekstra').map(k => (D.extras.find(x => x.key === k) || {}).name).filter(Boolean);
      const rows = [['Etkinlik', t ? t.name : '-'], ['Tarih', val('tarih') ? new Date(val('tarih') + 'T12:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirtilmedi'], ['Yer', [val('yer'), val('mekan')].filter(Boolean).join(', ') || '-'], ['Misafir', (val('misafir') || 0) + ' kişi' + (+val('cocuk') ? ` (${val('cocuk')} çocuk)` : '')], ['Konsept', val('konsept') === 'ozel' ? 'Kendi konseptim' : c ? c.name : 'Fark etmez'], ['Renk', val('renk')], ['Ekstralar', exN.join(', ') || '-']];
      sumEl.innerHTML = rows.map(r => `<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('');
    };
    const show = i => {
      cur = i;
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      dots.forEach((d, k) => { d.classList.toggle('on', k === i); d.classList.toggle('done', k < i); });
      prev.hidden = i === 0; next.hidden = i === steps.length - 1; sub.hidden = i !== steps.length - 1;
      err.textContent = '';
      if (i === 2) renderConcepts();
      if (i === steps.length - 1) summary();
      const y = pl.getBoundingClientRect().top + scrollY - 100; if (scrollY > y) scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      const f = steps[i].querySelector('input:not([type=hidden]):not(.hp)'); f && f.focus({ preventScroll: true });
    };
    const check = i => {
      if (i === 0 && !val('tur')) return 'Lütfen bir etkinlik türü seçin.';
      if (i === 1) { const g = +val('misafir'); if (!g || g < 1) return 'Lütfen misafir sayısını girin.'; if (g > 5000) return 'Misafir sayısı en fazla 5000 olabilir; daha kalabalık etkinlikler için notlara yazın.'; if (+val('cocuk') > g) return 'Çocuk sayısı misafir sayısından fazla olamaz.'; }
      return '';
    };
    next.addEventListener('click', () => { const m = check(cur); if (m) { err.textContent = m; return; } show(cur + 1); });
    prev.addEventListener('click', () => show(cur - 1));
    pl.addEventListener('change', e => { calc(); if (e.target.name === 'tur' && cur === 0) setTimeout(() => show(1), 220); });
    pl.addEventListener('input', calc);
    pl.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && cur < steps.length - 1) { e.preventDefault(); next.click(); } });
    pl.addEventListener('submit', async e => {
      e.preventDefault();
      if (!val('ad').trim() || !val('tel').trim()) { err.textContent = 'Lütfen adınızı ve telefonunuzu yazın.'; return; }
      if (!pl.elements.kvkk.checked) { err.textContent = 'Devam etmek için onay kutusunu işaretleyin.'; return; }
      const p = { kind: 'planla', tur: val('tur'), misafir: val('misafir'), cocuk: val('cocuk'), tarih: val('tarih'), yer: val('yer'), mekan: val('mekan'), konsept: val('konsept'), renk: val('renk'), ekstra: checked('ekstra'), not: val('not'), ad: val('ad'), tel: val('tel'), web: val('web') };
      sub.disabled = true; err.textContent = '';
      try { const j = await send(p); confetti(innerWidth / 2, innerHeight / 2); err.style.color = 'inherit'; err.textContent = `Talebiniz alındı (#${j.no}). WhatsApp açılıyor…`; setTimeout(() => { location.href = j.wa; }, 700); }
      catch (ex) {
        // sunucuya ulaşılamazsa mesajı tarayıcıda hazırla
        const t = D.types.find(x => x.slug === p.tur), c = D.concepts.find(x => x.slug === p.konsept);
        const exN = p.ekstra.map(k => (D.extras.find(x => x.key === k) || {}).name).filter(Boolean);
        const L = ['Merhaba Siba Organizasyon, web sitenizden ulaşıyorum. Talebim:', '🎉 Etkinlik: ' + (t ? t.name : '-')];
        if (p.tarih) L.push('📅 Tarih: ' + new Date(p.tarih + 'T12:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }));
        if (p.yer || p.mekan) L.push('📍 Yer: ' + [p.yer, (p.mekan || '').toLocaleLowerCase('tr')].filter(Boolean).join(', '));
        L.push('👥 Misafir: ' + p.misafir + ' kişi' + (+p.cocuk ? ` (${p.cocuk} çocuk)` : ''));
        L.push('🎨 Konsept: ' + (p.konsept === 'ozel' ? 'Kendi konseptim' : c ? c.name : 'Fark etmez') + (p.renk && p.renk !== 'Fark etmez' ? ' · ' + p.renk : ''));
        if (exN.length) L.push('➕ Ekstralar: ' + exN.join(', '));
        const o = calc(); if (o.length) L.push('🪑 Öneri: ' + o.map(x => x[0] + ': ' + x[1]).join(' · '));
        if (p.not) L.push('📝 Not: ' + p.not);
        L.push(`👤 ${p.ad} · 📞 ${p.tel}`, 'Fiyat teklifi rica ediyorum.');
        err.style.color = 'inherit'; err.textContent = 'WhatsApp açılıyor…';
        setTimeout(() => { location.href = 'https://wa.me/' + (D.wa || '905432331680') + '?text=' + encodeURIComponent(L.join('\n')); }, 500);
      }
      finally { sub.disabled = false; }
    });
    // ön seçim (?tur=)
    const ALIAS={'ates-gosterisi-atesbaz':'sahne-gosterileri','sihirbaz-gosterisi':'sahne-gosterileri','jonglor-gosterisi':'sahne-gosterileri','uzun-adam-tahta-bacak':'sahne-gosterileri','bubble-show-balon-gosterisi':'sahne-gosterileri','palyaco-gosterisi':'sahne-gosterileri','maskot-karakterler':'sahne-gosterileri','pamuk-seker-arabasi-kiralama':'pamuk-seker-popcorn-arabasi','popcorn-arabasi-kiralama':'pamuk-seker-popcorn-arabasi','ramazan-serbeti-dagitimi':'pamuk-seker-popcorn-arabasi','osmanli-macunu-kiralama':'pamuk-seker-popcorn-arabasi'}; const pre = ALIAS[qs.get('tur')] || qs.get('tur'); const r0 = pre && $$('[name="tur"]', pl).find(x => x.value === pre);
    if (r0) { r0.checked = true; show(1); } else show(0);
    calc();
  }
})();

/* ===== arama + hareketli zemin (eklenti) ===== */
(() => {
  'use strict';
  const d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* hareketli zemin */
  if (!d.querySelector('.bg-fx')) {
    const fx = d.createElement('div'); fx.className = 'bg-fx'; fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = '<i></i><i></i><i></i><b></b>';
    d.body.prepend(fx);
    if (!reduce && matchMedia('(hover:hover)').matches) {
      let tx = 0, ty = 0, x = 0, y = 0;
      let running = false;
      const loop = () => { x += (tx - x) * .08; y += (ty - y) * .08; fx.style.setProperty('--px', x.toFixed(1) + 'px'); fx.style.setProperty('--py', y.toFixed(1) + 'px');
        if (Math.abs(tx - x) > .3 || Math.abs(ty - y) > .3) requestAnimationFrame(loop); else running = false; };
      addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5) * 40; ty = (e.clientY / innerHeight - .5) * 40; if (!running) { running = true; requestAnimationFrame(loop); } }, { passive: true });
    }
  }
  /* arama */
  const topIn = d.querySelector('.top-in'); if (!topIn || d.querySelector('[data-ara]')) return;
  const ic = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
  const btn = d.createElement('button'); btn.type = 'button'; btn.className = 'ara-btn'; btn.setAttribute('data-ara', ''); btn.setAttribute('aria-label', 'Sitede ara'); btn.innerHTML = ic;
  const tb = topIn.querySelector('.theme-btn'); tb ? topIn.insertBefore(btn, tb) : topIn.appendChild(btn);
  const ov = d.createElement('div'); ov.className = 'ara'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Sitede ara');
  ov.innerHTML = '<div class="ara-in"><label class="ara-f">' + ic + '<input type="search" placeholder="Ne arıyorsunuz? Kukla, kına, kongre, şişme park…" autocomplete="off" spellcheck="false" aria-label="Arama"><button type="button" class="ara-x" aria-label="Kapat">Esc</button></label><div class="ara-tags"></div><ul class="ara-r" role="listbox"></ul></div>';
  d.body.appendChild(ov);
  const inp = ov.querySelector('input'), list = ov.querySelector('.ara-r'), tags = ov.querySelector('.ara-tags');
  const norm = s => (s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let data = null, sel = -1;
  const load = () => new Promise(res => { if (window.__ARA) return res(window.__ARA); const s = d.createElement('script'); s.src = 'assets/js/ara.js?v=4'; s.onload = () => res(window.__ARA || []); s.onerror = () => res([]); d.head.appendChild(s); });
  const popular = ['Kukla', 'Ramazan', 'Kına', 'Söz nişan', 'Kongre', 'Şişme park', 'Doğum günü', 'Sahne LED'];
  tags.innerHTML = popular.map(p => '<button type="button">' + p + '</button>').join('');
  tags.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { inp.value = b.textContent; run(); inp.focus(); } });
  const run = () => {
    const q = norm(inp.value.trim()); sel = -1;
    tags.hidden = !!q;
    if (!q) { list.innerHTML = ''; return; }
    const ws = q.split(/\s+/).filter(Boolean);
    const res = (data || []).map(it => {
      const T = norm(it.t), D = norm(it.d), K = norm(it.k); let sc = 0;
      for (const w of ws) { if (T.includes(w)) sc += T.startsWith(w) ? 12 : 8; else if (K.includes(w)) sc += 3; else if (D.includes(w)) sc += 2; else return null; }
      return { it, sc };
    }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 8);
    list.innerHTML = res.length ? res.map((r, i) => '<li><a href="' + esc(r.it.u) + '" role="option" data-i="' + i + '"><b>' + esc(r.it.t) + '</b><span>' + esc(r.it.d) + '</span></a></li>').join('') : '<li class="ara-none">Sonuç bulunamadı. <a href="https://wa.me/905432331680" target="_blank" rel="noopener">WhatsApp’tan sorun</a></li>';
  };
  const mark = () => list.querySelectorAll('a[data-i]').forEach((a, i) => a.classList.toggle('on', i === sel));
  const open = async () => { ov.hidden = false; d.documentElement.classList.add('ara-on'); requestAnimationFrame(() => ov.classList.add('in')); inp.focus(); data = data || await load(); run(); };
  const close = () => { ov.classList.remove('in'); d.documentElement.classList.remove('ara-on'); setTimeout(() => { ov.hidden = true; }, 220); btn.focus(); };
  btn.addEventListener('click', open);
  ov.querySelector('.ara-x').addEventListener('click', close);
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  inp.addEventListener('input', run);
  d.addEventListener('keydown', e => {
    if (!ov.hidden) {
      const as = list.querySelectorAll('a[data-i]');
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown' && as.length) { e.preventDefault(); sel = (sel + 1) % as.length; mark(); }
      else if (e.key === 'ArrowUp' && as.length) { e.preventDefault(); sel = (sel - 1 + as.length) % as.length; mark(); }
      else if (e.key === 'Enter' && as.length) { e.preventDefault(); location.href = as[Math.max(0, sel)].getAttribute('href'); }
      return;
    }
    const tag = (e.target.tagName || '').toLowerCase();
    if ((e.key === '/' && !/input|textarea|select/.test(tag)) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); open(); }
  });
})();
/* açılış kaydırıcı */
(function(){var s=document.querySelector('[data-slider]');if(!s)return;var t=s.querySelector('.mx-track'),d=[].slice.call(s.querySelectorAll('.mx-dots button')),n=d.length,i=0,timer,paused=false;
function go(k){i=(k+n)%n;t.scrollTo({left:i*t.clientWidth,behavior:'smooth'})}
function mark(){var k=Math.round(t.scrollLeft/Math.max(1,t.clientWidth));if(k!==i)i=k;d.forEach(function(b,j){b.setAttribute('aria-current',j===i?'true':'false')})}
var raf;t.addEventListener('scroll',function(){cancelAnimationFrame(raf);raf=requestAnimationFrame(mark)},{passive:true});
d.forEach(function(b,j){b.addEventListener('click',function(){go(j);restart()})});
s.querySelector('.prev').addEventListener('click',function(){go(i-1);restart()});s.querySelector('.next').addEventListener('click',function(){go(i+1);restart()});
function start(){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;timer=setInterval(function(){if(!paused&&!document.hidden)go(i+1)},5500)}
function restart(){clearInterval(timer);start()}
s.addEventListener('mouseenter',function(){paused=true});s.addEventListener('mouseleave',function(){paused=false});
t.addEventListener('touchstart',function(){restart()},{passive:true});
window.addEventListener('resize',function(){t.scrollLeft=i*t.clientWidth});start();})();
/* gezinme: geri butonu, kaydırarak geri, sayfa başına dönme, konum hatırlama */
(function(){
var KEY='siba-yol',POS='siba-konum';
function page(){var h=location.pathname.split('/').pop();return h||'index.html'}
var here=page(),isHome=here==='index.html';
function J(k,d){try{return JSON.parse(sessionStorage.getItem(k)||d)}catch(e){return JSON.parse(d)}}
function S(k,v){try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}}
try{history.scrollRestoration='manual'}catch(e){}
var st=J(KEY,'[]'),pos=J(POS,'{}');
var cameBack=false;try{cameBack=!!sessionStorage.getItem('siba-geri');sessionStorage.removeItem('siba-geri')}catch(e){}
var nav=(performance.getEntriesByType&&performance.getEntriesByType('navigation')[0])||{};
if(nav.type==='back_forward')cameBack=true;
if(cameBack){if(st.length>1&&st[st.length-2]===here)st.pop()}
else if(!(st.length&&st[st.length-1]===here)){st.push(here);if(st.length>40)st=st.slice(-40)}
S(KEY,st);
/* konum: geri gelince eski yerine, yeni sayfada en üste */
var target=(cameBack||nav.type==='reload')?(pos[here]||0):0;
function place(){var h=document.documentElement;var b=h.style.scrollBehavior;h.style.scrollBehavior='auto';window.scrollTo(0,target);h.style.scrollBehavior=b}
place();document.addEventListener('DOMContentLoaded',place);addEventListener('load',function(){place();setTimeout(place,60)});
addEventListener('pageshow',function(e){if(e.persisted){/* bfcache: tarayıcı zaten doğru yerde tutar */}});
function save(){pos[here]=Math.round(window.scrollY||0);S(POS,pos)}
addEventListener('pagehide',save);addEventListener('beforeunload',save);
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(a)save()},true);
function fallback(){var c=document.querySelectorAll('.crumbs a');return c.length?c[c.length-1].getAttribute('href'):'./'}
function back(){
  save();
  if(st.length>1){st.pop();S(KEY,st);var p=st[st.length-1];try{sessionStorage.setItem('siba-geri','1')}catch(e){}location.href=p==='index.html'?'./':p;return}
  var f=fallback();S(KEY,[f==='./'?'index.html':f]);try{sessionStorage.setItem('siba-geri','1')}catch(e){}location.href=f;
}
window.__sibaBack=back;
var top=document.querySelector('.top-in');
if(top&&!isHome){
  var b=document.createElement('button');b.type='button';b.className='back-btn';b.setAttribute('aria-label','Geri');
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  b.addEventListener('click',back);top.insertBefore(b,top.firstChild);
}
/* kenardan kaydırarak geri: yalnızca uygulama/çerçeve içinde; parmağı takip eden ok göstergesi */
var framed=false;try{framed=window.self!==window.top}catch(e){framed=true}
if(framed&&!isHome){
  var sx=0,sy=0,act=false,lock=null,dx=0,TH=80;
  document.addEventListener('touchstart',function(e){if(e.touches.length>1)return;var t=e.touches[0];act=t.clientX<28;lock=null;dx=0;sx=t.clientX;sy=t.clientY},{passive:true});
  document.addEventListener('touchmove',function(e){if(!act)return;var t=e.touches[0],x=t.clientX-sx,y=t.clientY-sy;
    if(lock===null&&(Math.abs(x)>8||Math.abs(y)>8))lock=Math.abs(x)>Math.abs(y)*1.2&&x>0?'h':'v';
    if(lock!=='h'){act=false;return}
    e.preventDefault();dx=Math.max(0,x)},{passive:false});
  function end(){if(!act)return;act=false;if(lock==='h'&&dx>=TH)back()}
  document.addEventListener('touchend',end,{passive:true});document.addEventListener('touchcancel',end,{passive:true});
}
})();
