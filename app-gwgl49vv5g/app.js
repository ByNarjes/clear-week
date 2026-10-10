/* Clear Week Budget app. Plain JS, offline, data stays on this device. */
(function () {
  'use strict';
  const E = window.CWEngine;
  const VERSION = '1.0.0';
  const KEY = 'clearweek.v1';
  const DEMO = window.CW_FORCE_DEMO === true || /[?&]demo\b/.test(location.search) || /\/demo\/?$/.test(location.pathname);
  const $ = (sel, el) => (el || document).querySelector(sel);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const today = () => E.localToday();

  // ---------- icons ----------
  const I = {
    home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    log: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    cal: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    jar: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 4h10M8 4v3a5 5 0 0 0-3 4.6V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7.4A5 5 0 0 0 16 7V4"/><path d="M9 14h6"/></svg>',
    gear: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    plus: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    bill: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
    pot: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="13" r="7"/><path d="M12 6V3M9 13h6"/></svg>',
    bag: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 8h14l-1 13H6z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
    in: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
    debt: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'
  };
  const CATS = ['Groceries', 'Eating out', 'Transport', 'Home', 'Fun', 'Other'];

  // ---------- state ----------
  function blank() {
    return { v: 1, settings: { currency: 'USD', weekStart: 1, theme: 'auto', setupDone: false, example: false, startDate: today(), startBalance: 0, lastBackup: null, weeklyMode: false, cats: CATS.slice() },
      pay: { freq: 'biweekly', anchor: E.addDays(today(), 14), amount: 0, early: false, days: [1, 15] }, entries: [], bills: [], pots: [], debts: [], debtOrder: 'small', debtExtra: 0 };
  }
  function example() {
    const t = today(), A = E.addDays;
    const s = blank();
    s.settings.example = true; s.settings.setupDone = true; s.settings.startDate = A(t, -16); s.settings.startBalance = 96250;
    s.pay = { freq: 'biweekly', anchor: A(t, 9), amount: 185000, early: true, days: [1, 15] };
    const d = n => A(t, n);
    const ymd = (n) => d(n).slice(0, 8);
    s.bills = [
      { id: 'b1', name: 'Rent', amount: 120000, freq: 'monthly', anchor: E.dateOf(+t.slice(0, 4), +t.slice(5, 7) - 2, 1) },
      { id: 'b2', name: 'Phone', amount: 6500, freq: 'monthly', anchor: E.dateOf(+t.slice(0, 4), +t.slice(5, 7) - 2, +d(1).slice(8)) },
      { id: 'b3', name: 'Car insurance', amount: 14200, freq: 'monthly', anchor: E.dateOf(+t.slice(0, 4), +t.slice(5, 7) - 2, +d(5).slice(8)) },
      { id: 'b4', name: 'Internet', amount: 7000, freq: 'monthly', anchor: E.dateOf(+t.slice(0, 4), +t.slice(5, 7) - 2, +d(7).slice(8)) },
      { id: 'b5', name: 'Streaming', amount: 1599, freq: 'monthly', anchor: E.dateOf(+t.slice(0, 4), +t.slice(5, 7) - 2, +d(-3).slice(8)) },
      { id: 'b6', name: 'Car registration', amount: 18000, freq: 'yearly', anchor: d(140), fund: true, fundStart: 5500 }
    ];
    s.pots = [{ id: 'p1', name: 'Christmas', perPay: 6000, target: 48000, start: 18000 }, { id: 'p2', name: 'Car repairs', perPay: 4000, target: 0, start: 12000 }];
    s.debts = [{ id: 'd1', name: 'Credit card', balance: 312000, rate: 22.99, min: 9500, day: 20 }];
    const sp = (n, amt, cat, note) => ({ id: uid(), date: d(n), type: 'spend', amount: amt, cat, note: note || '' });
    s.entries = [
      sp(-15, 6840, 'Groceries'), sp(-14, 1250, 'Eating out', 'Lunch'), sp(-12, 2150, 'Transport', 'Bus pass top-up'), sp(-11, 3999, 'Fun', 'Concert'),
      sp(-9, 5420, 'Groceries'), sp(-8, 480, 'Eating out', 'Coffee'), sp(-6, 2300, 'Home', 'Light bulbs'), sp(-4, 7110, 'Groceries'),
      sp(-3, 1890, 'Eating out', 'Pizza'), sp(-1, 2150, 'Transport', 'Fuel'), sp(0, 480, 'Eating out', 'Coffee'), sp(0, 3210, 'Groceries')
    ];
    // bills already paid earlier this month
    for (const b of s.bills) for (const due of E.billDates(b, s.settings.startDate, A(t, -1))) s.entries.push({ id: uid(), date: due, type: 'billpay', billId: b.id, due, amount: b.amount, note: b.name });
    return s;
  }
  let S, memoryOnly = DEMO;
  function load() {
    if (DEMO) return example();
    try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return migrate(s); } } catch (e) { /* storage blocked */ memoryOnly = true; }
    return example();
  }
  function migrate(s) { const b = blank(); s.settings = Object.assign(b.settings, s.settings || {}); s.pay = Object.assign(b.pay, s.pay || {}); ['entries', 'bills', 'pots', 'debts'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; }); return s; }
  function save(msg, undo) {
    if (!memoryOnly) {
      try { localStorage.setItem(KEY, JSON.stringify(S)); askPersist(); }
      catch (e) { toast('Could not save on this device. Your browser may be in private mode or full. Try Settings › Back up now.'); return false; }
    }
    if (msg) toast(msg, undo);
    return true;
  }
  let persistAsked = false;
  function askPersist() { if (persistAsked || !navigator.storage || !navigator.storage.persist) return; persistAsked = true; navigator.storage.persist().catch(() => {}); }
  function applyAuto() { const add = E.autoEntries(S, today()); if (add.length) { S.entries.push(...add); save(); } }

  // ---------- money format ----------
  let fmtCache = {};
  function nf() { const c = S.settings.currency || 'USD'; if (!fmtCache[c]) { try { fmtCache[c] = new Intl.NumberFormat(undefined, { style: 'currency', currency: c }); } catch (e) { fmtCache[c] = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }); } } return fmtCache[c]; }
  const money = c => nf().format((c || 0) / 100);
  const decs = () => { const d = nf().resolvedOptions().maximumFractionDigits; return d >= 0 && d <= 2 ? d : 2; };
  const toIn = c => (c || c === 0) && c !== '' ? (c / 100).toFixed(decs()) : '';
  const ph = () => decs() ? '0.' + '0'.repeat(decs()) : '0';
  const cin = v => { const c = E.cents(v); if (c == null) return c; const u = Math.pow(10, 2 - decs()); return Math.round(c / u) * u; };
  const floorUnit = c => { const u = Math.pow(10, 2 - decs()); return Math.floor(c / u) * u; };
  function moneySplit(c) { // big number: whole part + cents part
    const parts = nf().formatToParts((c || 0) / 100); let main = '', dec = '';
    let afterDec = false; for (const p of parts) { if (p.type === 'decimal') { afterDec = true; dec += p.value; } else if (afterDec && (p.type === 'fraction')) dec += p.value; else if (afterDec && p.type === 'currency') dec += p.value; else main += p.value; }
    return '<span>' + esc(main) + '</span><span class="c">' + esc(dec) + '</span>';
  }
  function symbol() { const p = nf().formatToParts(0).find(x => x.type === 'currency'); return p ? p.value : '$'; }
  // dates
  const DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function nice(s, short) { if (!E.isDate(s)) return ''; const w = E.dow(s), d = +s.slice(8), m = +s.slice(5, 7) - 1; return short ? DN[w].slice(0, 3) + ' ' + d + ' ' + MN[m].slice(0, 3) : DN[w] + ' ' + d + ' ' + MN[m]; }
  function rel(s) { const t = today(); const n = E.diff(s, t); if (n === 0) return 'Today'; if (n === 1) return 'Tomorrow'; if (n === -1) return 'Yesterday'; if (n > 1 && n < 7) return DN[E.dow(s)]; return nice(s, true); }

  // ---------- theme ----------
  function applyTheme() {
    const th = S.settings.theme; const root = document.documentElement;
    if (th === 'light' || th === 'dark') root.setAttribute('data-theme', th); else root.removeAttribute('data-theme');
    const dark = th === 'dark' || (th !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    const m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#161817' : '#F4F2EF');
  }

  // ---------- routing ----------
  let view = 'week'; let setupStep = 0; let setupDraft = null;
  function go(v) { view = v; render(); window.scrollTo(0, 0); }

  // ---------- toast ----------
  let toastTimer;
  function toast(msg, undo) {
    const el = $('#toast'); el.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button data-act="undo">Undo</button>' : '');
    el.hidden = false; el._undo = undo || null; clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; el._undo = null; }, undo ? 10000 : 4000);
  }

  // ---------- sheets ----------
  function openSheet(html, onOpen) {
    closeSheet();
    const scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.dataset.act = 'close';
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
    sh.innerHTML = '<div class="grab"></div>' + html; document.body.append(scrim, sh);
    document.body.style.overflow = 'hidden';
    if (onOpen) onOpen(sh); const f = sh.querySelector('[autofocus]'); if (f && matchMedia('(min-width:960px)').matches) f.focus();
  }
  function closeSheet() { document.querySelectorAll('.scrim,.sheet').forEach(n => n.remove()); document.body.style.overflow = ''; }

  // ---------- render ----------
  function render() {
    applyTheme();
    const root = $('#app');
    if (!S.settings.setupDone || setupStep > 0) { root.innerHTML = renderSetup(); return; }
    const c = E.compute(S, today());
    const navBtn = (v, ic, lab) => `<button class="${view === v ? 'on' : ''}" data-go="${v}" aria-current="${view === v ? 'page' : 'false'}">${ic}<span>${lab}</span></button>`;
    const main = { week: renderWeek, log: renderLog, bills: renderBills, aside: renderAside, settings: renderSettings }[view](c);
    root.innerHTML = (DEMO ? '<div class="demo-bar">Demo · nothing here is saved · <a href="https://www.etsy.com/shop/ByNarjes" target="_blank" rel="noopener">Clear Week Budget by ByNarjes</a></div>' : '') +
      `<div class="wrap"><nav class="nav" aria-label="Main"><div class="brand">Clear Week</div>${navBtn('week', I.home, 'This week')}${navBtn('log', I.log, 'Money log')}${navBtn('bills', I.cal, 'Bills')}${navBtn('aside', I.jar, 'Set aside')}</nav>` +
      `<main class="main">${main}</main><aside class="side">${renderSide(c)}</aside></div>`;
  }

  function payWord() { return S.pay.freq === 'irregular' ? 'your plan-until date' : 'payday'; }
  function header(title, help) {
    return `<div class="top"><div class="wk">${esc(nice(today()))}</div><button class="iconbtn" data-go="settings" aria-label="Settings">${I.gear}</button></div>` +
      (title ? `<h1 class="title">${esc(title)}</h1><p class="help">${esc(help || '')}</p>` : '');
  }

  function renderWeek(c) {
    const t = today(); const ws = S.settings.weekStart === 0 ? 0 : 1;
    const dayNo = E.diff(t, c.weekStart) + 1;
    // runway: one block per day from today until the day before payday (max 31)
    const total = Math.min(31, c.daysToPayday); let blocks = '';
    for (let i = 0; i < total; i++) { const d = E.addDays(t, i); const inWeek = d <= c.weekEndEff; blocks += `<i class="${i === 0 ? 'td' : inWeek ? 'wk' : ''}" title="${esc(nice(d, true))}"></i>`; }
    const big = c.show; const zero = big === 0;
    let sub;
    if (c.past > 0) sub = `You're <b>${money(c.past)}</b> past this week's amount. Next week starts fresh on ${DN[ws]}.`;
    else if (c.untilPayday <= 0) sub = (c.billsDue + c.setAside > 0 ? `Bills and set-asides use everything until ${payWord()} on <b>${esc(nice(c.next))}</b>.` : `Your balance leaves nothing extra until ${payWord()} on <b>${esc(nice(c.next))}</b>.`) + ' Nothing extra to spend this week.';
    else sub = `About <b>${money(floorUnit(c.perDay))} a day</b>${c.daysLeftWeek > 1 ? ' for the rest of this week' : ' today'}. You have <b>${money(c.untilPayday)}</b> until ${payWord()} on ${esc(nice(c.next))}.`;
    const nextBill = c.due.find(x => x.date >= t);
    let calm = '';
    const planOver = S.pay.freq === 'irregular' && S.pay.anchor <= t;
    if (planOver) calm = `<div class="calm">Your plan-until date has passed. When do you next expect money in? <button class="btn small" style="margin-top:10px" data-act="edit-pay">Pick a new date</button></div>`;
    else if (S.settings.example) calm = `<div class="calm">These are example numbers, so you can look around. <button class="btn small" style="margin-top:10px" data-act="start-mine">Clear them and start mine</button></div>`;
    else if (nextBill && E.diff(nextBill.date, t) <= 2) calm = `<div class="calm">${esc(nextBill.name)} (${money(nextBill.amount)}) is due ${rel(nextBill.date).toLowerCase() === 'today' ? 'today' : rel(nextBill.date).toLowerCase() === 'tomorrow' ? 'tomorrow' : 'on ' + esc(rel(nextBill.date))}. It's already counted.</div>`;
    else if (needsBackup()) calm = `<div class="calm">It's been a while since your last backup. <button class="btn small sec" style="margin-top:10px" data-act="backup">Back up in one tap</button></div>`;
    else if (c.crossesPayday) calm = `<div class="calm">Payday is ${esc(rel(c.next).toLowerCase() === 'tomorrow' ? 'tomorrow' : 'on ' + rel(c.next))}. A fresh pay period starts then.</div>`;
    const dueNames = c.due.slice(0, 3).map(x => x.name).join(', ') + (c.due.length > 3 ? '…' : '');
    const nSp = S.entries.filter(e => e.type === 'spend' && !e.potId && e.date >= (c.weekStart > c.periodStart ? c.weekStart : c.periodStart) && e.date <= t).length;
    return `${header()}
      <div class="lbl" id="numlbl">Okay to spend this week</div>
      <div class="num ${zero ? 'zero' : ''} ${money(big).replace(/\D/g, '').length > 8 ? 'long' : money(big).replace(/\D/g, '').length > 6 ? 'mid' : ''}" aria-labelledby="numlbl" role="text" data-act="explain" title="How this number is made">${moneySplit(big)}</div>
      <p class="sub">${sub}</p>
      <div class="run" aria-hidden="true"><div class="bar">${blocks}</div>
        <div class="runlab"><span>Today</span><span>${S.pay.freq === 'irregular' ? 'Plan until' : 'Payday'} · ${esc(nice(c.next, true))}</span></div>
        <div class="key"><i class="k1"></i>rest of this week <i class="k2"></i>after this week · one block = one day</div></div>
      ${calm}
      <div class="sheetcard">
        <button class="row tap" style="width:100%;text-align:left" data-go="bills"><span class="l"><span class="ic">${I.bill}</span><span class="t"><div>Bills before ${S.pay.freq === 'irregular' ? 'plan-until date' : 'payday'}</div><em>${c.due.length ? esc(dueNames) : S.bills.length || S.debts.length ? 'None left before payday' : 'No bills added yet'}</em></span></span><b>${money(c.billsDue)}</b></button>
        <button class="row tap" style="width:100%;text-align:left" data-go="aside"><span class="l"><span class="ic">${I.pot}</span><span class="t"><div>Set aside</div><em>${S.pots.length || c.fundsTotal ? esc(S.pots.map(p => p.name).concat(S.bills.filter(b => b.fund).map(b => b.name)).slice(0, 3).join(', ')) : 'Nothing set aside yet'}</em></span></span><b>${money(c.setAside)}</b></button>
        <button class="row tap" style="width:100%;text-align:left" data-go="log"><span class="l"><span class="ic">${I.bag}</span><span class="t"><div>Spent this week</div><em>${nSp} ${nSp === 1 ? 'spend' : 'spends'}</em></span></span><b>${money(c.spentWeek)}</b></button>
      </div>
      <div class="addbar"><button class="btn" data-act="add">${I.plus}Add a spend</button></div>`;
  }

  function renderSide(c) {
    const t = today();
    const list = c.due.filter(x => x.date >= t).slice(0, 4).map(x => `<div class="row"><span class="t"><div>${esc(x.name)}</div><em>${esc(rel(x.date))}</em></span><b>${money(x.amount)}</b></div>`).join('');
    const pay = `<div class="row"><span class="t"><div>Payday</div><em>${esc(nice(c.next, true))}</em></span><b class="in">${S.pay.freq !== 'irregular' && S.pay.amount ? '+' + money(S.pay.amount) : ''}</b></div>`;
    const sp = S.entries.filter(e => e.type === 'spend').sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 4).map(e => `<div class="row"><span class="t"><div>${esc(e.note || e.cat)}</div><em>${esc(rel(e.date))}</em></span><b>${money(e.amount)}</b></div>`).join('');
    return `<div class="sect" style="margin-top:58px">Coming up</div><div class="card">${list || '<div class="empty">No bills before payday.</div>'}${pay}</div>
      <div class="sect">Latest spends</div><div class="card">${sp || '<div class="empty">Nothing logged yet.</div>'}</div>`;
  }

  function renderLog() {
    const list = S.entries.filter(e => e.type === 'spend' || e.type === 'in' || e.type === 'adjust' || e.type === 'billpay').sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
    let html = header('Money log', 'Everything you spent or received, newest first. Tap a line to change or delete it.');
    html += `<div class="actions" style="margin-top:0"><button class="btn small" data-act="add">${I.plus}Spend</button><button class="btn small sec" data-act="moneyin">${I.in}Money in</button><button class="btn small sec" data-act="balance">Balance</button></div>`;
    if (!list.length) return html + '<div class="card"><div class="empty">Nothing here yet. Tap "Spend" to add your first one.</div></div>';
    let cur = ''; let body = '';
    for (const e of list.slice(0, 400)) {
      if (e.date !== cur) { if (cur) body += '</div>'; cur = e.date; body += `<div class="sect">${esc(rel(e.date))}</div><div class="card">`; }
      const isIn = e.type === 'in' || (e.type === 'adjust' && e.amount > 0);
      const title = e.type === 'billpay' ? (e.note || 'Bill') + ' (paid)' : e.type === 'adjust' ? 'Balance update' : (e.note || e.cat || (isIn ? 'Money in' : 'Spend'));
      const sub = e.type === 'spend' ? (e.potId ? 'From ' + ((S.pots.find(p => p.id === e.potId) || {}).name || 'a pot') : e.cat) + (e.week ? ' · week total' : '') : e.type === 'in' ? (e.cat || 'Money in') : e.type === 'billpay' ? 'Bill' : 'Matched to your bank';
      const ic = e.type === 'billpay' ? I.bill : isIn ? I.in : I.bag;
      body += `<button class="row tap" style="width:100%;text-align:left" data-act="edit-entry" data-id="${esc(e.id)}"><span class="l"><span class="ic">${ic}</span><span class="t"><div>${esc(title)}</div><em>${esc(sub)}</em></span></span><b class="${isIn ? 'in' : ''}">${isIn ? '+' : e.type === 'adjust' ? '−' : ''}${money(Math.abs(e.amount))}</b></button>`;
    }
    return html + body + '</div>';
  }

  function renderBills(c) {
    const t = today(); const paid = E.paidKeys(S);
    let html = header('Bills & paydays', 'Bills before your next payday are already counted. Tick one when it\'s paid.');
    html += `<div class="sect" style="margin-top:6px">${S.pay.freq === 'irregular' ? 'Before your plan-until date' : 'Before payday'} · ${esc(nice(c.next, true))}</div><div class="card">`;
    if (!c.due.length) html += '<div class="empty">Nothing left to pay before payday.</div>';
    for (const x of c.due) html += `<div class="row"><span class="l"><button class="tick" data-act="pay-bill" data-bill="${esc(x.billId)}" data-due="${x.date}" aria-label="Mark ${esc(x.name)} paid"></button><span class="t"><div>${esc(x.name)}</div><em>${esc(rel(x.date))}${x.full && x.full !== x.amount ? ' · rest comes from what you set aside' : ''}</em></span></span><b>${money(x.amount)}</b></div>`;
    html += '</div>';
    // paid this period
    const paidNow = S.entries.filter(e => e.type === 'billpay' && e.due && e.due >= c.periodStart && e.due < c.next);
    if (paidNow.length) html += `<div class="note" style="margin:8px 4px 0">Paid this period: ${paidNow.map(e => esc(e.note)).join(', ')}.</div>`;
    // paydays
    const pd = S.pay.freq === 'irregular' ? [c.next] : E.paydays(S.pay, E.addDays(t, 1), E.addDays(t, 120)).slice(0, 3);
    html += `<div class="sect">Next paydays</div><div class="card">`;
    pd.forEach((d, i) => {
      const end = pd[i + 1] ? E.addDays(pd[i + 1], -1) : E.addDays(d, S.pay.freq === 'weekly' ? 6 : S.pay.freq === 'biweekly' ? 13 : 30);
      const covers = []; for (const b of S.bills) for (const bd of E.billDates(b, d, end)) if (!(b.fund && E.isFundable(b))) covers.push(b.name);
      html += `<div class="row"><span class="l"><span class="ic">${I.in}</span><span class="t"><div>${esc(nice(d, true))}${S.pay.amount && S.pay.freq !== 'irregular' ? ' · ' + money(S.pay.amount) : ''}</div><em>${covers.length ? 'Covers ' + esc(covers.join(', ')) : 'No bills in that period'}</em></span></span></div>`;
    });
    html += `</div>`;
    const three = E.threePaycheckMonths(S.pay, t, 12);
    if (three.length) html += `<div class="calm">Three-paycheck ${three.length > 1 ? 'months' : 'month'} ahead: ${three.map(k => MN[+k.slice(5) - 1] + ' ' + k.slice(0, 4)).join(' and ')}. A good month to get ahead.</div>`;
    // month view
    html += `<div class="sect">This month</div><div class="card" style="padding:14px">${monthGrid(t)}</div>`;
    // all bills
    html += `<div class="sect">All bills</div><div class="card">`;
    if (!S.bills.length) html += '<div class="empty">No bills yet.</div>';
    for (const b of S.bills) {
      const nx = E.billDates(b, t, E.addDays(t, 800))[0];
      html += `<button class="row tap" style="width:100%;text-align:left" data-act="edit-bill" data-id="${esc(b.id)}"><span class="l"><span class="ic">${I.bill}</span><span class="t"><div>${esc(b.name)}</div><em>${esc(freqText(b))}${nx ? ' · next ' + esc(rel(nx)) : ''}${b.fund && E.isFundable(b) ? ' · ' + money(E.fundShare(b, S.pay)) + ' set aside each payday' : ''}</em></span></span><b>${money(b.amount)}</b></button>`;
    }
    html += `</div><div class="actions"><button class="btn small" data-act="edit-bill">${I.plus}Add a bill</button><button class="btn small sec" data-act="ics" ${S.bills.length ? '' : 'disabled'}>Add bills to my calendar</button></div>
      <div class="actions" style="margin-top:10px"><button class="btn small sec" data-act="edit-pay">Change pay schedule</button></div>`;
    return html;
  }
  function freqText(b) {
    const day = +(b.day || b.anchor.slice(8)); const o = day >= 31 ? 'last day' : ordinal(day);
    return { monthly: 'Monthly on the ' + o, weekly: 'Every week', biweekly: 'Every 2 weeks', yearly: 'Every year', once: 'Once · ' + nice(b.anchor, true), months: 'Every ' + (b.every || 2) + ' months' }[b.freq] || '';
  }
  function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function monthGrid(t) {
    const y = +t.slice(0, 4), m = +t.slice(5, 7); const first = E.dateOf(y, m, 1); const n = E.daysInMonth(y, m); const ws = S.settings.weekStart === 0 ? 0 : 1;
    const lead = (E.dow(first) - ws + 7) % 7; const last = E.dateOf(y, m, n);
    const bills = {}; for (const b of S.bills) for (const d of E.billDates(b, first, last)) bills[d] = (bills[d] || []).concat(b.name);
    const pays = new Set(S.pay.freq === 'irregular' ? [] : E.paydays(S.pay, first, last));
    const hd = (ws === 0 ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']).map(h => `<div class="h">${h}</div>`).join('');
    let cells = ''; for (let i = 0; i < lead; i++) cells += '<div class="d out"></div>';
    for (let i = 1; i <= n; i++) { const d = E.dateOf(y, m, i); cells += `<div class="d ${d === t ? 'today' : ''} ${pays.has(d) ? 'pay' : ''}" title="${esc((bills[d] || []).join(', '))}${pays.has(d) ? ' Payday' : ''}">${i}${bills[d] ? '<i></i>' : ''}</div>`; }
    return `<div style="font-weight:700;margin-bottom:8px">${MN[m - 1]} ${y}</div><div class="cal">${hd}${cells}</div><div class="key" style="margin-top:10px"><i style="background:var(--accS)"></i>payday <i style="background:var(--acc);border-radius:3px;width:8px;height:8px;margin-left:8px"></i>bill</div>`;
  }

  function renderAside(c) {
    let html = header('Set aside & debts', 'Money kept for later is taken off your number, so it\'s there when you need it.');
    html += `<div class="sect" style="margin-top:6px">Pots · ${money(c.potsTotal)}</div><div class="card">`;
    if (!S.pots.length) html += '<div class="empty">No pots yet. A pot keeps a little from each payday for something coming up.</div>';
    for (const p of S.pots) {
      const saved = E.potSaved(S, p.id); const pct = p.target > 0 ? Math.min(100, Math.round(saved * 100 / p.target)) : 0;
      html += `<button class="row tap" style="width:100%;text-align:left;display:block" data-act="edit-pot" data-id="${esc(p.id)}"><span style="display:flex;justify-content:space-between;gap:12px"><span class="t"><div>${esc(p.name)}</div><em>${p.perPay ? money(p.perPay) + ' each payday' : 'No regular amount'}${p.target ? ' · goal ' + money(p.target) : ''}</em></span><b>${money(saved)}</b></span>${p.target ? `<span class="prog" style="display:block"><i style="width:${pct}%"></i></span>` : ''}</button>`;
    }
    html += `</div><div class="actions"><button class="btn small" data-act="edit-pot">${I.plus}Add a pot</button><button class="btn small sec" data-act="use-pot" ${S.pots.length ? '' : 'disabled'}>Spend from a pot</button></div>`;
    const funded = S.bills.filter(b => b.fund && E.isFundable(b));
    if (funded.length) {
      html += `<div class="sect">Big bills, a little each payday · ${money(c.fundsTotal)}</div><div class="card">`;
      for (const b of funded) { const sv = E.fundSaved(S, b.id); const nx = E.billDates(b, today(), E.addDays(today(), 800))[0]; html += `<div class="row"><span class="t"><div>${esc(b.name)}</div><em>${money(b.amount)} due ${nx ? esc(nice(nx, true)) : ''} · ${money(E.fundShare(b, S.pay))} each payday</em></span><b>${money(sv)}</b></div>`; }
      html += '</div>';
    }
    // debts
    const t = today(); const plan = E.debtPlan(S.debts, S.debtOrder, S.debtExtra, [+t.slice(0, 4), +t.slice(5, 7)]);
    const total = S.debts.reduce((x, d) => x + Math.max(0, d.balance), 0);
    html += `<div class="sect">Debts · ${money(total)}</div><div class="card">`;
    if (!S.debts.length) html += '<div class="empty">No debts added. If you have a card or loan, add it to see a debt-free date.</div>';
    for (const d of S.debts) { const p = plan.list.find(x => x.id === d.id); html += `<button class="row tap" style="width:100%;text-align:left" data-act="edit-debt" data-id="${esc(d.id)}"><span class="l"><span class="ic">${I.debt}</span><span class="t"><div>${esc(d.name)}</div><em>${d.rate ? d.rate + '% · ' : ''}${money(d.min)} a month${p && p.ym ? ' · paid off ' + ymText(p.ym) : ''}</em></span></span><b>${money(d.balance)}</b></button>`; }
    html += '</div>';
    if (S.debts.length) {
      html += `<div class="card" style="padding:16px 18px"><div style="font-weight:700">${plan.ok ? 'Debt-free in ' + ymText(plan.freeYm) : 'At these payments the balance does not go down. Try a bigger monthly amount.'}</div>
        <p class="note" style="margin:6px 0 12px">${plan.ok ? 'About ' + plan.months + ' months, paying the minimums' + (S.debtExtra ? ' plus ' + money(S.debtExtra) + ' extra' : '') + ' each month. Estimate only, from your own numbers.' : ''}</p>
        <div class="seg" role="group" aria-label="Pay order"><button class="${S.debtOrder !== 'rate' ? 'on' : ''}" data-act="debt-order" data-v="small">Smallest first</button><button class="${S.debtOrder === 'rate' ? 'on' : ''}" data-act="debt-order" data-v="rate">Highest rate first</button></div>
        <label class="field"><span>Extra each month (optional)</span><input class="inp" inputmode="decimal" id="debtExtra" value="${S.debtExtra ? toIn(S.debtExtra) : ''}" placeholder="${ph()}"></label></div>`;
    }
    html += `<div class="actions"><button class="btn small" data-act="edit-debt">${I.plus}Add a debt</button></div>`;
    return html;
  }
  function ymText(s) { return s ? MN[+s.slice(5) - 1] + ' ' + s.slice(0, 4) : ''; }

  function renderSettings() {
    const st = S.settings; const curs = ['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'ZAR', 'INR', 'JPY', 'MXN', 'BRL', 'SGD', 'AED'];
    return `<div class="top"><button class="iconbtn" data-go="week" aria-label="Back">${I.back}</button><div class="wk">Settings</div><span style="width:44px"></span></div>
      <h1 class="title">Settings</h1><p class="help">Everything here stays on this device.</p>
      <div class="card">
        <button class="row tap" style="width:100%;text-align:left" data-act="balance"><span class="t"><div>Update my balance</div><em>Match what your bank says now. Takes one number.</em></span></button>
        <button class="row tap" style="width:100%;text-align:left" data-act="edit-pay"><span class="t"><div>Pay schedule</div><em>${esc(payText())}</em></span></button>
        <button class="row tap" style="width:100%;text-align:left" data-act="moneyin"><span class="t"><div>Add money in</div><em>Extra pay, a refund, a gift</em></span></button>
      </div>
      <div class="sect">Look</div><div class="card" style="padding:14px 18px">
        <div class="seg" role="group" aria-label="Theme">${['auto', 'light', 'dark'].map(v => `<button class="${st.theme === v ? 'on' : ''}" data-act="theme" data-v="${v}">${{ auto: 'Auto', light: 'Light', dark: 'Dark' }[v]}</button>`).join('')}</div>
        <label class="field"><span>Currency</span><select class="inp" id="setCur">${curs.map(c => `<option ${c === st.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <div class="field"><span>Week starts on</span><div class="seg"><button class="${st.weekStart !== 0 ? 'on' : ''}" data-act="weekstart" data-v="1">Monday</button><button class="${st.weekStart === 0 ? 'on' : ''}" data-act="weekstart" data-v="0">Sunday</button></div></div>
        <div class="field"><span>How you log spending</span><div class="seg"><button class="${!st.weeklyMode ? 'on' : ''}" data-act="weekly" data-v="0">Each purchase</button><button class="${st.weeklyMode ? 'on' : ''}" data-act="weekly" data-v="1">One total a week</button></div><em>With "one total a week", add one amount per category each week. No need to log every coffee.</em></div>
      </div>
      <div class="sect">Keep your numbers safe</div><div class="card">
        <button class="row tap" style="width:100%;text-align:left" data-act="backup"><span class="t"><div>Back up now</div><em>${st.lastBackup ? 'Last backup: ' + esc(nice(st.lastBackup, true)) : 'Saves a small backup file. Keep it in your files or cloud storage'}</em></span></button>
        <label class="row tap" style="cursor:pointer"><span class="t"><div>Restore from a backup</div><em>Also how you move to a new phone</em></span><input type="file" accept=".clearweek,.json,application/json" id="restoreFile" hidden></label>
        <button class="row tap" style="width:100%;text-align:left" data-act="export"><span class="t"><div>Export to a spreadsheet</div><em>An .xlsx file for any spreadsheet app</em></span></button>
        <button class="row tap" style="width:100%;text-align:left" data-act="install"><span class="t"><div>Add to home screen</div><em>Opens like an app and helps keep your numbers on this phone</em></span></button>
      </div>
      <div class="sect">Start over</div><div class="card">
        ${st.example ? `<button class="row tap" style="width:100%;text-align:left" data-act="start-mine"><span class="t"><div>Clear the example numbers</div><em>Then answer 5 quick questions</em></span></button>` : ''}
        <button class="row tap" style="width:100%;text-align:left" data-act="reset"><span class="t"><div class="danger">Erase everything on this device</div><em>Back up first if you want to keep anything</em></span></button>
      </div>
      <p class="note" style="margin:22px 4px">Clear Week Budget ${VERSION} · by ByNarjes. A budgeting tool to help you plan, not financial advice. No account, no tracking: your numbers never leave this device.</p>`;
  }
  function payText() { const p = S.pay; const f = { weekly: 'Every week', biweekly: 'Every 2 weeks', semimonthly: 'Twice a month', monthly: 'Monthly', irregular: 'It changes' }[p.freq]; return f + (p.amount && p.freq !== 'irregular' ? ' · ' + money(p.amount) : '') + ' · next ' + nice(E.nextPayday(p, today()), true); }

  // ---------- setup (5 questions) ----------
  function renderSetup() {
    const d = setupDraft; const st = setupStep;
    const head = `<div class="wrap" style="padding-bottom:40px"><div class="top"><div class="wk">Clear Week</div>${st > 1 ? `<button class="iconbtn" data-act="setup-back" aria-label="Back">${I.back}</button>` : ''}</div>`;
    if (st === 0 || st === 0.5) return head + installCard(true) + '</div>';
    const prev = previewNumber();
    const pv = st >= 3 && prev != null ? `<div class="preview"><div style="font-size:14px;font-weight:600">Okay to spend this week</div><b>${money(prev)}</b><div class="note">It updates as you answer.</div></div>` : '';
    let body = '';
    if (st === 1) body = `<div class="step">${qn(1)}</div><div class="q">How much is in your everyday account right now?</div><p class="help">Look at your banking app. A rough number is fine. You can update it any time.</p>
      <label class="field"><span>Balance</span><input class="inp" id="q1" inputmode="decimal" autocomplete="off" placeholder="${ph()}" value="${d.bal ? toIn(d.bal) : ''}" autofocus></label>`;
    else if (st === 2) body = `<div class="step">${qn(2)}</div><div class="q">How often are you paid, and when is your next payday?</div>
      <div class="choice" role="group">${[['weekly', 'Every week'], ['biweekly', 'Every 2 weeks'], ['semimonthly', 'Twice a month'], ['monthly', 'Monthly'], ['irregular', 'It changes']].map(([v, l]) => `<button class="${d.freq === v ? 'on' : ''}" data-act="q2f" data-v="${v}">${l}</button>`).join('')}</div>
      ${d.freq === 'semimonthly' ? `<div class="two"><label class="field"><span>First payday of the month</span><input class="inp" id="q2a" inputmode="numeric" value="${d.days[0]}"></label><label class="field"><span>Second</span><input class="inp" id="q2b" inputmode="numeric" value="${d.days[1]}"><em>Use 31 for the last day</em></label></div>`
        : `<label class="field"><span>${d.freq === 'irregular' ? 'Plan until (your next expected money in)' : 'Next payday'}</span><input class="inp" type="date" id="q2d" value="${d.anchor}" min="${E.addDays(today(), 1)}"></label>`}
      ${d.freq === 'monthly' ? `<label class="field" style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="q2l" ${d.lastDay ? 'checked' : ''} style="width:22px;height:22px"><span style="margin:0">I'm paid on the last day of each month</span></label>` : ''}
      ${d.freq !== 'irregular' ? `<label class="field" style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="q2e" ${d.early ? 'checked' : ''} style="width:22px;height:22px"><span style="margin:0">If payday falls on a weekend, I'm paid on the Friday before</span></label>` : ''}
      ${d.freq !== 'irregular' && d.freq !== 'semimonthly' && d.early && [0, 6].includes(E.dow(d.anchor)) ? `<p class="note">That's a weekend, so we'll plan for ${esc(nice(E.addDays(d.anchor, E.dow(d.anchor) === 6 ? -1 : -2)))}.</p>` : ''}`;
    else if (st === 3) body = `<div class="step">${qn(3)}</div><div class="q">${d.freq === 'irregular' ? 'What\'s a safe low amount you can count on each month?' : 'About how much is a usual paycheck?'}</div>
      <p class="help">${d.freq === 'irregular' ? 'Only used for planning ahead. When money comes in, you add it with "Money in".' : 'After tax, what lands in your account. We add it for you on each payday, and you can change it if a paycheck is different.'}</p>
      <label class="field"><span>Amount</span><input class="inp" id="q3" inputmode="decimal" placeholder="${ph()}" value="${d.amount ? toIn(d.amount) : ''}" autofocus></label>`;
    else if (st === 4) body = `<div class="step">${qn(4)}</div><div class="q">Your regular bills</div><p class="help">Add the monthly ones you know. Skip anything; you can add more later on the Bills screen.</p>
      <div class="note" style="display:grid;grid-template-columns:1fr 100px 74px 36px;gap:8px;margin-top:6px"><span>Bill</span><span>Amount</span><span>Day</span><span></span></div>
      ${d.bills.map((b, i) => `<div class="billrow"><input class="inp" data-b="${i}" data-k="name" value="${esc(b.name)}" aria-label="Bill name"><input class="inp" data-b="${i}" data-k="amount" inputmode="decimal" placeholder="${ph()}" value="${b.amount ? toIn(b.amount) : ''}" aria-label="${esc(b.name)} amount"><input class="inp" data-b="${i}" data-k="day" inputmode="numeric" placeholder="1–31" value="${b.day || ''}" aria-label="${esc(b.name)} day of month"><button class="iconbtn" data-act="q4del" data-i="${i}" aria-label="Remove ${esc(b.name)}">×</button></div>`).join('')}
      <button class="btn ghost" data-act="q4add">${I.plus}Add another bill</button>`;
    else if (st === 5) body = `<div class="step">${qn(5)}</div><div class="q">A few choices</div>
      <label class="field"><span>Currency</span><select class="inp" id="q5c">${['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'ZAR', 'INR', 'JPY', 'MXN', 'BRL', 'SGD', 'AED'].map(c => `<option ${c === d.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <div class="field"><span>Your week starts on</span><div class="seg"><button class="${d.weekStart !== 0 ? 'on' : ''}" data-act="q5w" data-v="1">Monday</button><button class="${d.weekStart === 0 ? 'on' : ''}" data-act="q5w" data-v="0">Sunday</button></div></div>
      <div class="field"><span>Look</span><div class="seg">${['auto', 'light', 'dark'].map(v => `<button class="${d.theme === v ? 'on' : ''}" data-act="q5t" data-v="${v}">${{ auto: 'Auto', light: 'Light', dark: 'Dark' }[v]}</button>`).join('')}</div></div>`;
    const last = st === 5;
    return head + body + pv + `<div class="actions"><button class="btn" data-act="setup-next">${last ? 'Show my week' : 'Next'}</button></div>${st === 4 || st === 3 ? '<button class="btn ghost" data-act="setup-skip">Skip this question</button>' : ''}</div>`;
  }
  function qn(n) { const irr = setupDraft && setupDraft.freq === 'irregular'; return 'Question ' + (irr && n > 3 ? n - 1 : n) + ' of ' + (irr ? 4 : 5); }
  function previewNumber() {
    if (!setupDraft) return null; try { const s = draftToState(setupDraft); return E.compute(s, today()).show; } catch (e) { return null; }
  }
  function draftToState(d) {
    const s = blank(); const t = today();
    s.settings.startDate = t; s.settings.startBalance = d.bal || 0; s.settings.currency = d.currency; s.settings.weekStart = d.weekStart; s.settings.theme = d.theme; s.settings.setupDone = true;
    s.pay = { freq: d.freq, anchor: d.freq === 'semimonthly' ? E.dateOf(+t.slice(0, 4), +t.slice(5, 7), d.days[0]) : d.anchor, amount: d.freq === 'irregular' ? 0 : (d.amount || 0), early: !!d.early, days: d.days.slice() };
    if (d.freq === 'monthly' && d.lastDay) s.pay.day = 31;
    s.bills = d.bills.filter(b => b.amount > 0 && b.day >= 1 && b.day <= 31).map(b => ({ id: uid(), name: b.name.trim() || 'Bill', amount: b.amount, freq: 'monthly', anchor: E.dateOf(+t.slice(0, 4), +t.slice(5, 7) - 1, Math.min(b.day, 28)), day: b.day }));
    return s;
  }
  function newDraft() {
    return { bal: 0, freq: 'biweekly', anchor: E.addDays(today(), 7), days: [1, 15], early: true, amount: 0, currency: guessCurrency(), weekStart: 1, theme: 'auto',
      bills: ['Rent', 'Phone', 'Internet', 'Car insurance'].map(n => ({ name: n, amount: 0, day: '' })) };
  }
  function guessCurrency() { try { const l = (navigator.language || 'en-US').toUpperCase(); if (/GB/.test(l)) return 'GBP'; if (/CA/.test(l)) return 'CAD'; if (/AU/.test(l)) return 'AUD'; if (/NZ/.test(l)) return 'NZD'; if (/-(DE|FR|ES|IT|NL|IE|PT|AT|BE|FI)/.test(l)) return 'EUR'; } catch (e) { } return 'USD'; }
  function readStep() {
    const d = setupDraft, st = setupStep, v = id => { const el = document.getElementById(id); return el ? el.value : ''; };
    if (st === 1) { const c = cin(v('q1')); if (c == null) return 'Type the balance as a number, like 1240.50. A negative number is fine if you\'re overdrawn.'; d.bal = E.clampMoney(c); }
    if (st === 2) {
      if (d.freq === 'semimonthly') { const a = parseInt(v('q2a'), 10), b = parseInt(v('q2b'), 10); if (!(a >= 1 && a <= 31 && b >= 1 && b <= 31 && a !== b)) return 'Pick two different days between 1 and 31.'; d.days = [Math.min(a, b), Math.max(a, b)]; }
      else { const dt = v('q2d'); if (!E.isDate(dt) || dt <= today()) return 'Pick a date after today.'; d.anchor = dt; }
      const e = document.getElementById('q2e'); d.early = e ? e.checked : false; const l = document.getElementById('q2l'); d.lastDay = !!(l && l.checked);
    }
    if (st === 3) { const raw = v('q3'); if (raw.trim()) { const c = cin(raw); if (c == null || c < 0) return 'Type the amount as a number, like 1850.'; d.amount = E.clampMoney(c); } }
    if (st === 4) {
      document.querySelectorAll('[data-b]').forEach(el => { const b = d.bills[+el.dataset.b]; if (!b) return; if (el.dataset.k === 'name') b.name = el.value.slice(0, 40); if (el.dataset.k === 'amount') b.amount = Math.max(0, cin(el.value) || 0); if (el.dataset.k === 'day') b.day = parseInt(el.value, 10) || ''; });
      const bad = d.bills.find(b => b.amount > 0 && !(b.day >= 1 && b.day <= 31)); if (bad) return `Add a day (1–31) for ${bad.name || 'that bill'}, or clear its amount.`;
    }
    if (st === 5) { d.currency = v('q5c') || d.currency; }
    return null;
  }

  function installCard(inSetup) {
    const ua = navigator.userAgent; const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const mobile = /Android|iPhone|iPad|iPod/.test(ua) || ios;
    const steps = ios ? '<ol><li>Tap the <b>Share</b> button (the square with an arrow) at the bottom of the screen.</li><li>Scroll down and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. Then open Clear Week from your home screen.</li></ol><p class="note">Use the web browser that came with your phone for this step.</p>'
      : deferredPrompt ? '<p>Tap the button below, then <b>Install</b>.</p>' : '<ol><li>Open your browser menu (often <b>⋮</b> at the top right).</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li><li>Open Clear Week from your home screen.</li></ol>';
    const top = `<h1 class="title" style="margin-top:18px">${standalone ? 'You\'re all set' : mobile ? 'First, add Clear Week to your home screen' : 'Welcome to Clear Week'}</h1>
      <p class="help">${standalone ? 'Clear Week is on your home screen and works offline.' : 'It then opens like an app, works without internet, and your phone is less likely to clear your numbers. It takes 20 seconds.'}</p>`;
    return `${top}${standalone || !mobile ? '' : `<div class="install">${steps}${deferredPrompt ? '<button class="btn" data-act="do-install" style="margin-top:12px">Add to home screen</button>' : ''}</div>`}
      ${!mobile && !standalone ? '<p class="note">On a computer you can keep using it in this browser tab. Some browsers also show an install icon in the address bar.</p>' : ''}
      ${inSetup ? `<div class="actions"><button class="btn" data-act="setup-begin">${standalone || !mobile ? 'Start the 5 questions' : 'I did it, start the 5 questions'}</button></div>${!standalone && mobile ? '<button class="btn ghost" data-act="setup-begin">Skip for now</button>' : ''}` : ''}`;
  }

  // ---------- sheets: add spend ----------
  let padVal = '';
  function openAdd(potMode) {
    padVal = ''; const st = S.settings; let cat = st.lastCat && st.cats.includes(st.lastCat) ? st.lastCat : st.cats[0];
    let potId = potMode && S.pots[0] ? S.pots[0].id : null; let dt = today(); let weekTotal = !!st.weeklyMode;
    const draw = (sh) => {
      sh.innerHTML = `<div class="grab"></div><h2>${potId ? 'Spend from a pot' : weekTotal ? 'Add this week\'s total' : 'Add a spend'}</h2>
        <div class="amt" aria-live="polite"><span class="cur">${esc(symbol())}</span>${esc(padVal || '0')}</div>
        <div class="chips" role="group" aria-label="${potId ? 'Pot' : 'Category'}">${potId ? S.pots.map(p => `<button class="chip ${p.id === potId ? 'on' : ''}" data-pick-pot="${esc(p.id)}">${esc(p.name)} · ${money(E.potSaved(S, p.id))}</button>`).join('') : st.cats.map(cc => `<button class="chip ${cc === cat ? 'on' : ''}" data-pick-cat="${esc(cc)}">${esc(cc)}</button>`).join('')}</div>
        <div class="pad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', decs() ? '.' : '', '0', '⌫'].map(k => k ? `<button data-key="${k}" aria-label="${k === '⌫' ? 'Delete' : k === '.' ? 'Decimal point' : k}">${k}</button>` : '<span></span>').join('')}</div>
        <div class="two" style="margin-top:12px"><label class="field" style="margin:0"><span>Note (optional)</span><input class="inp" id="addNote" maxlength="60" placeholder="${potId ? 'Gifts' : 'Coffee'}"></label><label class="field" style="margin:0"><span>Date</span><input class="inp" type="date" id="addDate" value="${dt}" max="${today()}"></label></div>
        <div class="actions"><button class="btn sec" data-act="close" style="width:40%">Cancel</button><button class="btn" data-act="add-save">Save</button></div>`;
    };
    openSheet('', sh => {
      draw(sh);
      sh.addEventListener('click', ev => {
        const k = ev.target.closest('[data-key]'), c = ev.target.closest('[data-pick-cat]'), p = ev.target.closest('[data-pick-pot]');
        const keep = () => { const n = $('#addNote', sh), d = $('#addDate', sh); return [n && n.value, d && d.value]; };
        if (k) { padKey(k.dataset.key); const [n, d] = keep(); draw(sh); $('#addNote', sh).value = n || ''; $('#addDate', sh).value = d || dt; }
        if (c) { cat = c.dataset.pickCat; const [n, d] = keep(); draw(sh); $('#addNote', sh).value = n || ''; $('#addDate', sh).value = d || dt; }
        if (p) { potId = p.dataset.pickPot; const [n, d] = keep(); draw(sh); $('#addNote', sh).value = n || ''; $('#addDate', sh).value = d || dt; }
        if (ev.target.closest('[data-act="add-save"]')) {
          const amt = cin(padVal); if (!amt || amt <= 0) { toast('Type an amount first.'); return; }
          const d = $('#addDate', sh).value; const when = E.isDate(d) && d <= today() ? d : today();
          const e = { id: uid(), date: when, type: 'spend', amount: E.clampMoney(amt), cat: potId ? 'From a pot' : cat, note: ($('#addNote', sh).value || '').trim().slice(0, 60) };
          let extraId = null;
          if (potId) { const sv = E.potSaved(S, potId); if (amt > sv) { e.amount = sv; if (sv <= 0) { delete e.potId; e.cat = cat; e.amount = E.clampMoney(amt); } else { extraId = uid(); S.entries.push({ id: extraId, date: when, type: 'spend', amount: E.clampMoney(amt - sv), cat, note: ((e.note ? e.note + ' ' : '') + '(more than the pot had)').trim() }); } } if (sv > 0) e.potId = potId; }
          if (weekTotal && !potId) e.week = true;
          S.entries.push(e); if (!potId) S.settings.lastCat = cat; closeSheet(); save(potId && !e.potId ? 'That pot was empty, so it\'s saved as a normal spend' : 'Saved · ' + money(amt), () => { S.entries = S.entries.filter(x => x.id !== e.id && x.id !== extraId); save(); render(); }); render(); bump();
        }
      });
      sh._key = ev => { if (/^[0-9.]$/.test(ev.key)) { padKey(ev.key); } else if (ev.key === 'Backspace' && document.activeElement.tagName !== 'INPUT') { padKey('⌫'); } else if (ev.key === 'Enter') { const b = sh.querySelector('[data-act="add-save"]'); if (b) b.click(); return; } else return; const n = $('#addNote', sh).value, d = $('#addDate', sh).value; draw(sh); $('#addNote', sh).value = n; $('#addDate', sh).value = d; };
    });
  }
  function padKey(k) {
    if (k === '⌫') { padVal = padVal.slice(0, -1); return; }
    if (k === '.') { if (!decs() || padVal.includes('.')) return; padVal = (padVal || '0') + '.'; return; }
    if (padVal.includes('.') && padVal.split('.')[1].length >= decs()) return;
    if (padVal.replace('.', '').length >= 9) return;
    padVal = padVal === '0' ? k : padVal + k;
  }
  function bump() { const n = $('.num'); if (!n || matchMedia('(prefers-reduced-motion: reduce)').matches) return; n.animate([{ transform: 'scale(.97)', opacity: .6 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'ease-out' }); }

  // ---------- generic form sheet ----------
  function formSheet(title, help, fields, onSave, extra) {
    const html = `<h2>${esc(title)}</h2>${help ? `<p class="help">${esc(help)}</p>` : ''}<form id="fs" novalidate>${fields.map(f => fieldHtml(f)).join('')}
      <p class="danger" id="fsErr" role="alert" style="min-height:1.2em;margin:10px 0 0"></p>
      <div class="actions"><button type="button" class="btn sec" data-act="close" style="width:40%">Cancel</button><button class="btn" type="submit">Save</button></div>${extra || ''}</form>`;
    openSheet(html, sh => {
      $('#fs', sh).addEventListener('submit', ev => { ev.preventDefault(); const vals = {}; fields.forEach(f => { const el = sh.querySelector('#f_' + f.id); vals[f.id] = f.type === 'check' ? el.checked : el ? el.value : ''; }); const err = onSave(vals); if (err) { $('#fsErr', sh).textContent = err; } });
      sh.querySelectorAll('[data-show-when]').forEach(n => { const [id, vs] = n.dataset.showWhen.split('='); const src = sh.querySelector('#f_' + id); const upd = () => { n.hidden = !vs.split('|').includes(src.value); }; src.addEventListener('change', upd); upd(); });
    });
  }
  function fieldHtml(f) {
    const sw = f.showWhen ? ` data-show-when="${f.showWhen}"` : '';
    if (f.type === 'select') return `<label class="field"${sw}><span>${esc(f.label)}</span><select class="inp" id="f_${f.id}">${f.options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(f.value) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${f.hint ? `<em>${esc(f.hint)}</em>` : ''}</label>`;
    if (f.type === 'check') return `<label class="field" style="display:flex;gap:10px;align-items:flex-start"${sw}><input type="checkbox" id="f_${f.id}" ${f.value ? 'checked' : ''} style="width:22px;height:22px;flex:0 0 22px;margin-top:2px"><span style="margin:0;font-weight:500">${esc(f.label)}${f.hint ? `<em>${esc(f.hint)}</em>` : ''}</span></label>`;
    const im = f.type === 'money' ? 'inputmode="decimal" placeholder="' + ph() + '"' : f.type === 'int' ? 'inputmode="numeric"' : f.type === 'date' ? 'type="date"' : f.type === 'pct' ? 'inputmode="decimal" placeholder="0"' : 'maxlength="40"';
    const val = f.type === 'money' ? toIn(f.value) : (f.value == null ? '' : f.value);
    return `<label class="field"${sw}><span>${esc(f.label)}</span><input class="inp" id="f_${f.id}" ${im} value="${esc(val)}" ${f.auto ? 'autofocus' : ''}>${f.hint ? `<em>${esc(f.hint)}</em>` : ''}</label>`;
  }
  function delBtn(act, id, label) { return `<button type="button" class="btn ghost danger" data-act="${act}" data-id="${esc(id)}" style="margin-top:8px">${esc(label)}</button>`; }

  function editEntry(id) {
    const e = S.entries.find(x => x.id === id); if (!e) return;
    if (e.type === 'billpay') { openSheet(`<h2>${esc(e.note || 'Bill')} (paid)</h2><p class="help">Paid ${esc(nice(e.date, true))}, ${money(e.amount)}. Undo it if you ticked it by mistake.</p><div class="actions"><button class="btn sec" data-act="close">Keep</button><button class="btn" data-act="del-entry" data-id="${esc(e.id)}">Mark as not paid</button></div>`); return; }
    const isAdj = e.type === 'adjust';
    formSheet(isAdj ? 'Balance update' : e.type === 'in' ? 'Money in' : 'Spend', isAdj ? 'This line matched your balance to the bank. Delete it to undo.' : '', isAdj ? [] : [
      { id: 'amount', label: 'Amount', type: 'money', value: e.amount },
      e.type === 'spend' ? { id: 'cat', label: 'Category', type: 'select', value: e.cat, options: [...new Set(S.settings.cats.concat(e.cat ? [e.cat] : []))].map(c => [c, c]) } : { id: 'cat', label: 'What was it?', type: 'select', value: e.cat || 'Extra money', options: ['Paycheck', 'Extra money', 'Refund', 'Gift', 'Side job', 'Other'].map(c => [c, c]) },
      { id: 'note', label: 'Note (optional)', type: 'text', value: e.note && !e.auto ? e.note : '' },
      { id: 'date', label: 'Date', type: 'date', value: e.date },
      e.type === 'spend' ? { id: 'week', label: 'This is a week\'s total', type: 'check', value: !!e.week } : null
    ].filter(Boolean), v => {
      if (isAdj) { closeSheet(); return; }
      const a = cin(v.amount); if (a == null || a <= 0) return 'Type an amount above zero.'; if (!E.isDate(v.date)) return 'Pick a date.';
      const old = JSON.parse(JSON.stringify(e)); Object.assign(e, { amount: E.clampMoney(a), cat: v.cat, note: v.note.trim().slice(0, 60), date: v.date, week: !!v.week }); e.auto = false;
      closeSheet(); save('Saved', () => { Object.assign(e, old); save(); render(); }); render();
    }, delBtn('del-entry', e.id, /^pay-/.test(e.id) ? 'Remove this paycheck' : 'Delete'));
  }
  function delEntry(id) {
    const i = S.entries.findIndex(x => x.id === id); if (i < 0) return; const [e] = S.entries.splice(i, 1);
    // an automatic paycheck keeps a blank marker with the same id, so it is not added again on the next open
    const marker = /^(pay|pot|fund)-/.test(e.id) ? { id: e.id, type: 'void', date: e.date, amount: 0 } : null; if (marker) S.entries.push(marker);
    if (e.type === 'billpay' && e.debtId) { const d = S.debts.find(x => x.id === e.debtId); if (d) d.balance += e.amount; }
    closeSheet(); save('Deleted', () => { S.entries = S.entries.filter(x => x !== marker); S.entries.push(e); if (e.type === 'billpay' && e.debtId) { const d = S.debts.find(x => x.id === e.debtId); if (d) d.balance -= e.amount; } save(); render(); }); render();
  }

  function editBill(id) {
    const b = S.bills.find(x => x.id === id) || { id: null, name: '', amount: 0, freq: 'monthly', anchor: E.addDays(today(), 7), every: 3, fund: false };
    formSheet(b.id ? 'Edit bill' : 'Add a bill', 'Bills are taken off your number before they\'re due, so the money is there.', [
      { id: 'name', label: 'Name', type: 'text', value: b.name, auto: !b.id },
      { id: 'amount', label: 'Amount', type: 'money', value: b.amount || null },
      { id: 'freq', label: 'How often', type: 'select', value: b.freq, options: [['monthly', 'Every month'], ['biweekly', 'Every 2 weeks'], ['weekly', 'Every week'], ['months', 'Every few months'], ['yearly', 'Every year'], ['once', 'Just once']] },
      { id: 'every', label: 'Every how many months?', type: 'int', value: b.every || 3, showWhen: 'freq=months' },
      { id: 'anchor', label: 'Next due date', type: 'date', value: b.id ? (E.billDates(b, today(), E.addDays(today(), 800))[0] || b.anchor) : b.anchor, hint: 'The same day repeats each time.' },
      { id: 'last', label: 'Due on the last day of the month', type: 'check', value: +(b.day || 0) >= 31, showWhen: 'freq=monthly|months' },
      { id: 'fund', label: 'Put a little aside each payday for this bill', type: 'check', value: !!b.fund, showWhen: 'freq=months|yearly', hint: 'So a big bill never lands as one lump.' }
    ], v => {
      const a = cin(v.amount); if (!v.name.trim()) return 'Give the bill a name.'; if (a == null || a <= 0) return 'Type an amount above zero.'; if (!E.isDate(v.anchor)) return 'Pick the next due date.';
      const ev = Math.max(2, Math.min(24, parseInt(v.every, 10) || 3));
      const nb = Object.assign({}, b, { id: b.id || uid(), name: v.name.trim().slice(0, 40), amount: E.clampMoney(a), freq: v.freq, anchor: v.anchor, every: ev, fund: (v.freq === 'months' || v.freq === 'yearly') && v.fund });
      if (nb.freq === 'monthly' || nb.freq === 'months' || nb.freq === 'yearly') {
        const pick = +v.anchor.slice(8), dim = E.daysInMonth(+v.anchor.slice(0, 4), +v.anchor.slice(5, 7));
        // keep a 29th-31st day when the picked date is just that day clamped into a short month
        nb.day = (nb.freq !== 'yearly' && v.last) ? 31 : (b.id && pick === dim && +(b.day || 0) > pick && b.freq === nb.freq) ? +b.day : pick;
      } else delete nb.day;
      if (nb.fund && !(b.fund && E.isFundable(b))) nb.fundSince = today();
      // keep history: for an existing bill, start the new schedule from its next date
      const i = S.bills.findIndex(x => x.id === nb.id); const old = i >= 0 ? JSON.parse(JSON.stringify(S.bills[i])) : null;
      if (i >= 0) S.bills[i] = nb; else S.bills.push(nb);
      closeSheet(); save(b.id ? 'Bill updated' : 'Bill added', () => { if (old) S.bills[S.bills.findIndex(x => x.id === nb.id)] = old; else S.bills = S.bills.filter(x => x.id !== nb.id); save(); render(); }); render();
    }, b.id ? delBtn('del-bill', b.id, 'Delete this bill') : '');
  }
  function payBill(billId, due) {
    const t = today();
    if (billId.startsWith('debt:')) {
      const d = S.debts.find(x => 'debt:' + x.id === billId); if (!d) return; const amt = Math.min(d.min, d.balance);
      const e = { id: uid(), date: t, type: 'billpay', billId, due, amount: amt, note: d.name + ' payment', debtId: d.id }; S.entries.push(e); d.balance = Math.max(0, d.balance - amt);
      save('Marked paid · ' + money(amt), () => { S.entries = S.entries.filter(x => x.id !== e.id); d.balance += amt; save(); render(); }); render(); return;
    }
    const b = S.bills.find(x => x.id === billId); if (!b) return;
    const fromFund = b.fund && E.isFundable(b) ? Math.min(E.fundSaved(S, b.id), b.amount) : 0;
    const e = { id: uid(), date: t < due ? t : due, type: 'billpay', billId, due, amount: b.amount, note: b.name, fromFund };
    S.entries.push(e); save('Marked paid · ' + b.name, () => { S.entries = S.entries.filter(x => x.id !== e.id); save(); render(); }); render();
  }
  function editPot(id) {
    const p = S.pots.find(x => x.id === id) || { id: null, name: '', perPay: 0, target: 0, start: 0 };
    formSheet(p.id ? 'Edit pot' : 'Add a pot', 'A pot keeps money for later inside your account. It\'s taken off your number so you don\'t spend it by accident.', [
      { id: 'name', label: 'Name', type: 'text', value: p.name, auto: !p.id },
      { id: 'perPay', label: 'Put aside each payday', type: 'money', value: p.perPay || null },
      { id: 'target', label: 'Goal (optional)', type: 'money', value: p.target || null, hint: 'It stops adding once the goal is reached.' },
      { id: 'start', label: p.id ? 'Already in this pot (adjust)' : 'Already saved for this (optional)', type: 'money', value: p.id ? E.potSaved(S, p.id) : null }
    ], v => {
      if (!v.name.trim()) return 'Give the pot a name.'; const pp = cin(v.perPay || '0'), tg = cin(v.target || '0'), stt = cin(v.start || '0');
      if (pp == null || pp < 0 || tg == null || tg < 0 || stt == null || stt < 0) return 'Amounts need to be numbers, zero or more.';
      const np = Object.assign({}, p, { id: p.id || uid(), name: v.name.trim().slice(0, 40), perPay: E.clampMoney(pp), target: E.clampMoney(tg) });
      if (p.id) { const cur = E.potSaved(S, p.id); np.start = (p.start || 0) + (stt - cur); } else { np.start = E.clampMoney(stt); np.since = today(); }
      const i = S.pots.findIndex(x => x.id === np.id); const old = i >= 0 ? JSON.parse(JSON.stringify(S.pots[i])) : null; if (i >= 0) S.pots[i] = np; else { if (S.pots.length >= 6) return 'You can have up to 6 pots.'; S.pots.push(np); }
      closeSheet(); save(p.id ? 'Pot updated' : 'Pot added', () => { if (old) S.pots[S.pots.findIndex(x => x.id === np.id)] = old; else S.pots = S.pots.filter(x => x.id !== np.id); save(); render(); }); render();
    }, p.id ? delBtn('del-pot', p.id, 'Delete this pot (the money goes back to your number)') : '');
  }
  function editDebt(id) {
    const d = S.debts.find(x => x.id === id) || { id: null, name: '', balance: 0, rate: '', min: 0, day: '' };
    formSheet(d.id ? 'Edit debt' : 'Add a debt', 'Minimum payments are counted like bills. The balance goes down when you tick a payment as paid.', [
      { id: 'name', label: 'Name', type: 'text', value: d.name, auto: !d.id },
      { id: 'balance', label: 'What you owe now', type: 'money', value: d.balance || null },
      { id: 'rate', label: 'Interest rate (APR %)', type: 'pct', value: d.rate },
      { id: 'min', label: 'Monthly payment', type: 'money', value: d.min || null },
      { id: 'day', label: 'Payment day of the month', type: 'int', value: d.day, hint: '1–31. Leave empty if you pay it some other way.' }
    ], v => {
      const bal = cin(v.balance), mn = cin(v.min || '0'); const rate = v.rate === '' ? 0 : Number(String(v.rate).replace(',', '.')); const day = v.day === '' ? '' : parseInt(v.day, 10);
      if (!v.name.trim()) return 'Give it a name.'; if (bal == null || bal < 0) return 'Type what you owe as a number.'; if (!(rate >= 0 && rate <= 100)) return 'The rate should be between 0 and 100.'; if (mn == null || mn < 0) return 'Type the monthly payment as a number.'; if (day !== '' && !(day >= 1 && day <= 31)) return 'The day should be between 1 and 31.';
      const nd = Object.assign({}, d, { id: d.id || uid(), name: v.name.trim().slice(0, 40), balance: E.clampMoney(bal), rate: Math.round(rate * 100) / 100, min: E.clampMoney(mn), day });
      const i = S.debts.findIndex(x => x.id === nd.id); const old = i >= 0 ? JSON.parse(JSON.stringify(S.debts[i])) : null; if (i >= 0) S.debts[i] = nd; else S.debts.push(nd);
      closeSheet(); save(d.id ? 'Debt updated' : 'Debt added', () => { if (old) S.debts[S.debts.findIndex(x => x.id === nd.id)] = old; else S.debts = S.debts.filter(x => x.id !== nd.id); save(); render(); }); render();
    }, d.id ? delBtn('del-debt', d.id, 'Delete this debt') : '');
  }
  function editPay() {
    const p = S.pay;
    formSheet('Pay schedule', 'Your number plans until your next payday.', [
      { id: 'freq', label: 'How often are you paid?', type: 'select', value: p.freq, options: [['weekly', 'Every week'], ['biweekly', 'Every 2 weeks'], ['semimonthly', 'Twice a month'], ['monthly', 'Every month'], ['irregular', 'It changes']] },
      { id: 'anchor', label: 'Next payday', type: 'date', value: E.nextPayday(p, today()), showWhen: 'freq=weekly|biweekly|monthly' },
      { id: 'until', label: 'Plan until (next expected money in)', type: 'date', value: p.freq === 'irregular' ? p.anchor : E.addDays(today(), 14), showWhen: 'freq=irregular' },
      { id: 'd1', label: 'First payday of the month', type: 'int', value: (p.days || [1, 15])[0], showWhen: 'freq=semimonthly' },
      { id: 'd2', label: 'Second payday of the month (31 = last day)', type: 'int', value: (p.days || [1, 15])[1], showWhen: 'freq=semimonthly' },
      { id: 'amount', label: 'Usual paycheck (after tax)', type: 'money', value: p.amount || null, showWhen: 'freq=weekly|biweekly|semimonthly|monthly', hint: 'Added for you on each payday. Leave empty to add pay yourself with "Money in".' },
      { id: 'lastday', label: 'I\'m paid on the last day of each month', type: 'check', value: +(p.day || 0) >= 31, showWhen: 'freq=monthly' },
      { id: 'early', label: 'If payday falls on a weekend, I\'m paid the Friday before', type: 'check', value: !!p.early, showWhen: 'freq=weekly|biweekly|semimonthly|monthly' }
    ], v => {
      const np = Object.assign({}, p, { freq: v.freq, early: v.early });
      if (v.freq === 'irregular') { if (!E.isDate(v.until) || v.until <= today()) return 'Pick a date after today.'; np.anchor = v.until; np.amount = 0; }
      else if (v.freq === 'semimonthly') { const a = parseInt(v.d1, 10), b = parseInt(v.d2, 10); if (!(a >= 1 && a <= 31 && b >= 1 && b <= 31 && a !== b)) return 'Pick two different days between 1 and 31.'; np.days = [Math.min(a, b), Math.max(a, b)]; np.anchor = E.dateOf(+today().slice(0, 4), +today().slice(5, 7), np.days[0]); }
      else { if (!E.isDate(v.anchor) || v.anchor <= today()) return 'Pick a payday after today.'; np.anchor = v.anchor; }
      if (v.freq === 'monthly' && v.lastday) np.day = 31; else delete np.day;
      if (v.freq !== 'irregular') { const a = v.amount ? cin(v.amount) : 0; if (a == null || a < 0) return 'Type the paycheck as a number.'; np.amount = E.clampMoney(a); }
      // paydays up to today should not be re-added after a schedule change
      S.settings.startDate = S.settings.startDate > today() ? S.settings.startDate : (S.entries.some(e => e.id === 'pay-' + today()) ? today() : S.settings.startDate);
      const old = JSON.parse(JSON.stringify(S.pay)); if (np.freq === 'irregular') { const lp = E.lastPayday(old, today()); np.from = lp || (old.freq === 'irregular' ? old.from : undefined); if (!np.from) delete np.from; } else delete np.from; S.pay = np; markPastPaydaysDone();
      closeSheet(); save('Pay schedule saved', () => { S.pay = old; save(); render(); }); render();
    });
  }
  function markPastPaydaysDone() { // after a schedule change, don't back-fill paychecks for dates before today under the new schedule
    const t = today(); if (S.pay.freq === 'irregular') return;
    for (const d of E.paydays(S.pay, E.addDays(S.settings.startDate, 1), E.addDays(t, -1))) {
      if (!S.entries.some(e => e.id === 'pay-' + d)) S.entries.push({ id: 'pay-' + d, type: 'void', date: d, amount: 0 });
      for (const p of S.pots) if (!S.entries.some(e => e.id === 'pot-' + p.id + '-' + d)) S.entries.push({ id: 'pot-' + p.id + '-' + d, type: 'void', date: d, amount: 0 });
      for (const b of S.bills) if (!S.entries.some(e => e.id === 'fund-' + b.id + '-' + d)) S.entries.push({ id: 'fund-' + b.id + '-' + d, type: 'void', date: d, amount: 0 });
    }
  }
  function moneyIn() {
    formSheet('Money in', 'Extra pay, a refund, a gift. It adds to your number right away.', [
      { id: 'amount', label: 'Amount', type: 'money', value: null, auto: true },
      { id: 'cat', label: 'What is it?', type: 'select', value: 'Extra money', options: ['Paycheck', 'Extra money', 'Refund', 'Gift', 'Side job', 'Other'].map(c => [c, c]) },
      { id: 'note', label: 'Note (optional)', type: 'text', value: '' },
      { id: 'date', label: 'Date', type: 'date', value: today() }
    ], v => {
      const a = cin(v.amount); if (a == null || a <= 0) return 'Type an amount above zero.'; if (!E.isDate(v.date) || v.date > today()) return 'Pick today or an earlier date.';
      const e = { id: uid(), date: v.date, type: 'in', amount: E.clampMoney(a), cat: v.cat, note: v.note.trim().slice(0, 60) };
      S.entries.push(e); closeSheet(); save('Added · ' + money(a), () => { S.entries = S.entries.filter(x => x.id !== e.id); save(); render(); }); render(); bump();
    });
  }
  function updateBalance() {
    const cur = E.balance(S);
    formSheet('Update my balance', 'What does your bank say for your everyday account right now? We\'ll match it quietly.', [
      { id: 'bal', label: 'Balance now', type: 'money', value: cur, auto: true, hint: 'Your app currently thinks: ' + money(cur) + '. Include only money already in the account.' }
    ], v => {
      const a = cin(v.bal); if (a == null) return 'Type the balance as a number. A negative number is fine.'; const d = E.clampMoney(a) - cur;
      if (d === 0) { closeSheet(); toast('Already matching. Nothing to change.'); return; }
      const e = { id: uid(), date: today(), type: 'adjust', amount: d }; S.entries.push(e);
      closeSheet(); save('Balance matched', () => { S.entries = S.entries.filter(x => x.id !== e.id); save(); render(); }); render(); bump();
    });
  }
  function explain() {
    const c = E.compute(S, today());
    openSheet(`<h2>How this number is made</h2><p class="help">Everything is already counted. Here's the math.</p>
      <div class="card" style="box-shadow:none;background:var(--soft)">
        <div class="row"><span>Money in your account</span><b>${money(c.balance)}</b></div>
        <div class="row"><span>− Bills before ${payWord()} (${esc(nice(c.next, true))})</span><b>${money(c.billsDue)}</b></div>
        <div class="row"><span>− Set aside</span><b>${money(c.setAside)}</b></div>
        <div class="row"><span>= Okay until ${payWord()}</span><b>${money(c.untilPayday)}</b></div></div>
      <p class="help" style="margin-top:14px">That's shared out evenly over the ${c.daysToPayday === 1 ? 'day' : c.daysToPayday + ' days'} until ${payWord()}. This week's share was <b>${money(c.weekBudget)}</b>, and you've spent <b>${money(c.spentWeek)}</b> of it, so <b>${money(c.show)}</b> is okay to spend this week${c.past ? ` (you're ${money(c.past)} past it)` : ''}.</p>
      <div class="actions"><button class="btn" data-act="close">Got it</button></div>`);
  }

  // ---------- backup / restore / export / calendar ----------
  function needsBackup() { const st = S.settings; if (st.example || DEMO) return false; const n = S.entries.filter(e => !e.auto).length; if (n < 8) return false; return !st.lastBackup || E.diff(today(), st.lastBackup) >= 14; }
  async function shareOrDownload(blob, name) {
    try { const f = new File([blob], name, { type: blob.type }); if (navigator.canShare && navigator.canShare({ files: [f] }) && /Android|iPhone|iPad/.test(navigator.userAgent)) { await navigator.share({ files: [f], title: name }); return true; } } catch (e) { if (e && e.name === 'AbortError') return false; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); return true;
  }
  async function backup() {
    if (DEMO) { toast('Backups are off in the demo.'); return; }
    const blob = new Blob([JSON.stringify({ app: 'Clear Week Budget', version: VERSION, saved: new Date().toISOString(), data: S })], { type: 'application/json' });
    const ok = await shareOrDownload(blob, 'Clear Week backup ' + today() + '.clearweek');
    if (ok) { S.settings.lastBackup = today(); save('Backup saved. Keep it somewhere safe, like your cloud storage.'); render(); }
  }
  function restore(file) {
    const r = new FileReader(); r.onload = () => {
      try { const j = JSON.parse(r.result); const data = j && j.data ? j.data : j; if (!data || data.v !== 1 || !data.settings || !Array.isArray(data.entries)) throw new Error('bad');
        const old = S; S = migrate(data); S.settings.lastBackup = today(); closeSheet(); save('Restored from your backup', () => { S = old; save(); render(); }); view = 'week'; render();
      } catch (e) { toast('That file isn\'t a Clear Week backup. Pick a file that ends in .clearweek.'); }
    }; r.onerror = () => toast('Could not read that file. Try again.'); r.readAsText(file);
  }
  function icsEscape(s) { return String(s).replace(/[\\,;]/g, m => '\\' + m).replace(/\n/g, '\\n'); }
  function exportIcs() {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ByNarjes//Clear Week Budget//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Clear Week bills'];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    for (const b of S.bills) {
      const next = E.billDates(b, today(), E.addDays(today(), 800))[0]; if (!next) continue; const ds = next.replace(/-/g, ''); const de = E.addDays(next, 1).replace(/-/g, '');
      const day = +(b.day || b.anchor.slice(8)); let rule = '';
      // 29th/30th: the last of those days the month has (so February still gets a reminder); 31st = last day
      const md = day >= 31 ? 'BYMONTHDAY=-1' : day >= 29 ? 'BYMONTHDAY=' + Array.from({ length: day - 27 }, (_, i) => 28 + i).join(',') + ';BYSETPOS=-1' : 'BYMONTHDAY=' + day;
      if (b.freq === 'monthly') rule = 'RRULE:FREQ=MONTHLY;' + md;
      else if (b.freq === 'months') rule = 'RRULE:FREQ=MONTHLY;INTERVAL=' + (b.every || 2) + ';' + md;
      else if (b.freq === 'weekly') rule = 'RRULE:FREQ=WEEKLY'; else if (b.freq === 'biweekly') rule = 'RRULE:FREQ=WEEKLY;INTERVAL=2'; else if (b.freq === 'yearly') rule = next.slice(5) === '02-29' || (b.day >= 29 && +b.anchor.slice(5, 7) === 2) ? 'RRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=28,29;BYSETPOS=-1' : 'RRULE:FREQ=YEARLY';
      lines.push('BEGIN:VEVENT', 'UID:' + b.id + '@clearweek', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + ds, 'DTEND;VALUE=DATE:' + de, 'SUMMARY:' + icsEscape(b.name + ' · ' + money(b.amount)), 'DESCRIPTION:' + icsEscape('Bill reminder from Clear Week. Tick it as paid in the app once it\'s paid.'));
      if (rule) lines.push(rule); lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(b.name + ' is due tomorrow'), 'TRIGGER:-PT15H', 'END:VALARM', 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    const fold = l => { const enc = new TextEncoder(); if (enc.encode(l).length <= 75) return l; let out = '', cur = '', lim = 75; for (const ch of l) { if (enc.encode(cur + ch).length > lim) { out += cur + '\r\n '; cur = ''; lim = 74; } cur += ch; } return out + cur; };
    shareOrDownload(new Blob([lines.map(fold).join('\r\n') + '\r\n'], { type: 'text/calendar' }), 'Clear Week bills.ics').then(ok => ok && toast('Open the file to add your bills to your calendar.'));
  }
  // minimal .xlsx writer (stored zip, inline strings)
  function crc32(buf) { let c, crc = 0xFFFFFFFF; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xFF; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    const enc = new TextEncoder(); const parts = []; const central = []; let off = 0;
    const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
    for (const [name, text] of files) {
      const data = enc.encode(text), nm = enc.encode(name), crc = crc32(data);
      const head = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), 0, 0, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nm.length), 0, 0]);
      parts.push(head, nm, data);
      central.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), 0, 0, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nm.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off)]), nm);
      off += head.length + nm.length + data.length;
    }
    const cl = central.reduce((t, a) => t + a.length, 0);
    const end = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cl), ...u32(off), 0, 0]);
    return new Blob([...parts, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function xesc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
  function sheetXml(rows) {
    const col = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
      rows.map((r, ri) => '<row r="' + (ri + 1) + '">' + r.map((v, ci) => { const ref = col(ci) + (ri + 1); if (ri > 0 && E.isDate(v)) return '<c r="' + ref + '" s="2"><v>' + (E.diff(v, '1899-12-30')) + '</v></c>'; if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + (ri === 0 ? ' s="1"' : '') + '><v>' + v + '</v></c>'; return '<c r="' + ref + '" t="inlineStr"' + (ri === 0 ? ' s="1"' : '') + '><is><t>' + xesc(v == null ? '' : v) + '</t></is></c>'; }).join('') + '</row>').join('') + '</sheetData></worksheet>';
  }
  function exportXlsx() {
    const c = E.compute(S, today()); const m = n => Math.round(n) / 100;
    const sheets = [
      ['This week', [['What', 'Amount'], ['Okay to spend this week', m(c.show)], [S.pay.freq === 'irregular' ? 'Okay until plan-until date' : 'Okay until payday', m(c.untilPayday)], [S.pay.freq === 'irregular' ? 'Plan until' : 'Next payday', c.next], ['Money in your account', m(c.balance)], ['Bills before payday', m(c.billsDue)], ['Set aside', m(c.setAside)], ['Spent this week', m(c.spentWeek)], ['Exported', today()]]],
      ['Money log', [['Date', 'Type', 'Category', 'Note', 'Amount']].concat(S.entries.filter(e => ['spend', 'in', 'billpay', 'adjust'].includes(e.type)).sort((a, b) => a.date < b.date ? -1 : 1).map(e => [e.date, { spend: 'Spend', in: 'Money in', billpay: 'Bill paid', adjust: 'Balance update' }[e.type], e.cat || '', e.note || '', (e.type === 'in' || e.type === 'adjust' ? 1 : -1) * m(Math.abs(e.amount)) * (e.type === 'adjust' && e.amount < 0 ? -1 : 1)]))],
      ['Bills', [['Bill', 'Amount', 'How often', 'Next due']].concat(S.bills.map(b => [b.name, m(b.amount), freqText(b), E.billDates(b, today(), E.addDays(today(), 800))[0] || '']))],
      ['Set aside', [['Pot', 'Saved now', 'Each payday', 'Goal']].concat(S.pots.map(p => [p.name, m(E.potSaved(S, p.id)), m(p.perPay), p.target ? m(p.target) : '']))],
      ['Debts', [['Debt', 'Owed', 'Rate %', 'Monthly payment']].concat(S.debts.map(d => [d.name, m(d.balance), d.rate || 0, m(d.min)]))]
    ];
    const files = [
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map((s, i) => '<sheet name="' + xesc(s[0]) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']
    ].concat(sheets.map((s, i) => ['xl/worksheets/sheet' + (i + 1) + '.xml', sheetXml(s[1])]));
    shareOrDownload(zip(files), 'Clear Week ' + today() + '.xlsx').then(ok => ok && toast('Spreadsheet ready. Open it in any spreadsheet app.'));
  }

  // ---------- install ----------
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; if (setupStep === 0.5 || (!S.settings.setupDone)) render(); });

  // ---------- events ----------
  document.addEventListener('click', ev => {
    const g = ev.target.closest('[data-go]'); if (g) { go(g.dataset.go); return; }
    const a = ev.target.closest('[data-act]'); if (!a) return; const act = a.dataset.act;
    switch (act) {
      case 'close': closeSheet(); break;
      case 'undo': { const t = $('#toast'); if (t._undo) { const f = t._undo; t._undo = null; t.hidden = true; f(); toast('Undone'); } break; }
      case 'add': openAdd(false); break;
      case 'use-pot': openAdd(true); break;
      case 'moneyin': moneyIn(); break;
      case 'balance': updateBalance(); break;
      case 'explain': explain(); break;
      case 'edit-entry': editEntry(a.dataset.id); break;
      case 'del-entry': delEntry(a.dataset.id); break;
      case 'edit-bill': editBill(a.dataset.id); break;
      case 'del-bill': { const id = a.dataset.id; const old = S.bills.find(b => b.id === id); S.bills = S.bills.filter(b => b.id !== id); closeSheet(); save('Bill deleted', () => { S.bills.push(old); save(); render(); }); render(); break; }
      case 'pay-bill': payBill(a.dataset.bill, a.dataset.due); break;
      case 'edit-pay': editPay(); break;
      case 'edit-pot': editPot(a.dataset.id); break;
      case 'del-pot': { const id = a.dataset.id; const old = S.pots.find(p => p.id === id); S.pots = S.pots.filter(p => p.id !== id); closeSheet(); save('Pot deleted', () => { S.pots.push(old); save(); render(); }); render(); break; }
      case 'edit-debt': editDebt(a.dataset.id); break;
      case 'del-debt': { const id = a.dataset.id; const old = S.debts.find(d => d.id === id); S.debts = S.debts.filter(d => d.id !== id); closeSheet(); save('Debt deleted', () => { S.debts.push(old); save(); render(); }); render(); break; }
      case 'debt-order': S.debtOrder = a.dataset.v; save(); render(); break;
      case 'theme': S.settings.theme = a.dataset.v; save(); render(); break;
      case 'weekstart': S.settings.weekStart = +a.dataset.v; save(); render(); break;
      case 'weekly': S.settings.weeklyMode = a.dataset.v === '1'; save(S.settings.weeklyMode ? 'Weekly totals on' : 'Logging each purchase'); render(); break;
      case 'backup': backup(); break;
      case 'export': exportXlsx(); break;
      case 'ics': exportIcs(); break;
      case 'install': openSheet(installCard(false) + '<div class="actions"><button class="btn sec" data-act="close">Close</button></div>'); break;
      case 'do-install': if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.finally(() => { deferredPrompt = null; render(); }); } break;
      case 'start-mine': if (DEMO) { toast('This is the demo. In your own copy, this starts your 5 questions.'); break; } setupDraft = newDraft(); setupStep = 0.5; render(); break;
      case 'setup-begin': setupStep = 1; render(); break;
      case 'setup-back': { readStep(); setupStep = Math.max(1, setupStep - 1); if (setupStep === 3 && setupDraft.freq === 'irregular') setupStep = 2; render(); break; }
      case 'setup-skip': setupStep++; if (setupStep === 3 && setupDraft.freq === 'irregular') setupStep = 4; render(); break;
      case 'setup-next': { const err = readStep(); if (err) { toast(err); break; } if (setupStep < 5) { setupStep++; if (setupStep === 3 && setupDraft.freq === 'irregular') setupStep = 4; render(); } else { S = draftToState(setupDraft); setupStep = 0; setupDraft = null; view = 'week'; save('Your week is ready'); render(); } break; }
      case 'q2f': readStepSafe(); setupDraft.freq = a.dataset.v; render(); break;
      case 'q4add': readStepSafe(); setupDraft.bills.push({ name: '', amount: 0, day: '' }); render(); break;
      case 'q4del': readStepSafe(); setupDraft.bills.splice(+a.dataset.i, 1); render(); break;
      case 'q5w': setupDraft.weekStart = +a.dataset.v; render(); break;
      case 'q5t': setupDraft.theme = a.dataset.v; S.settings.theme = a.dataset.v; render(); break;
      case 'reset': openSheet(`<h2>Erase everything?</h2><p class="help">This removes all your numbers from this device. It can't be undone unless you have a backup.</p><div class="actions"><button class="btn sec" data-act="close">Keep my numbers</button><button class="btn" data-act="reset-yes" style="background:#A0453A;color:#fff">Erase</button></div>`); break;
      case 'reset-yes': try { localStorage.removeItem(KEY); } catch (e) { } S = example(); S.settings.example = true; closeSheet(); setupDraft = newDraft(); setupStep = 1; render(); break;
    }
  });
  function readStepSafe() { try { const st = setupStep; if (st === 4) readStep(); if (st === 2) { const e = document.getElementById('q2e'); if (e) setupDraft.early = e.checked; const l = document.getElementById('q2l'); if (l) setupDraft.lastDay = l.checked; const d = document.getElementById('q2d'); if (d && E.isDate(d.value)) setupDraft.anchor = d.value; } } catch (e) { } }
  document.addEventListener('change', ev => {
    if (ev.target.id === 'q2d' || ev.target.id === 'q2e' || ev.target.id === 'q2l') { readStepSafe(); render(); }
    if (ev.target.id === 'setCur') { S.settings.currency = ev.target.value; save('Currency changed'); render(); }
    if (ev.target.id === 'restoreFile' && ev.target.files[0]) restore(ev.target.files[0]);
    if (ev.target.id === 'debtExtra') { const c = cin(ev.target.value || '0'); if (c == null || c < 0) { toast('Type the extra amount as a number.'); return; } S.debtExtra = E.clampMoney(c); save(); setTimeout(render, 250); }
  });
  document.addEventListener('keydown', ev => { const sh = $('.sheet'); if (ev.key === 'Escape' && sh) { closeSheet(); return; } if (sh && sh._key && !(ev.target.tagName === 'INPUT' && ev.target.id !== '')) sh._key(ev); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  // new day / come back: recompute
  let lastDay = today();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && today() !== lastDay) { lastDay = today(); applyAuto(); render(); } });

  // ---------- boot ----------
  S = load(); applyAuto();
  if (memoryOnly && !DEMO) setTimeout(() => toast('This browser won\'t let Clear Week save. Try your device\'s main browser, not a private window.'), 600);
  render();
  if ('serviceWorker' in navigator && !DEMO && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__cw = { get state() { return S; }, compute: () => E.compute(S, today()), version: VERSION };
})();
