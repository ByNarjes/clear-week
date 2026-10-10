/* Clear Week engine: pure functions, no DOM. Money is whole cents (integers). Dates are 'YYYY-MM-DD' strings. */
(function (root) {
  'use strict';
  const DAY = 86400000;

  // ---------- dates ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toNum(s) { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); }
  function toStr(t) { const d = new Date(t); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function addDays(s, n) { return toStr(toNum(s) + n * DAY); }
  function diff(a, b) { return Math.round((toNum(a) - toNum(b)) / DAY); } // a - b in days
  function dow(s) { return new Date(toNum(s)).getUTCDay(); } // 0 Sun .. 6 Sat
  function ym(s) { return [Number(s.slice(0, 4)), Number(s.slice(5, 7))]; }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function dateOf(y, m, day) { // day 31 (or more than the month has) = last day of month
    while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; }
    return y + '-' + pad(m) + '-' + pad(Math.min(day, daysInMonth(y, m)));
  }
  function localToday(now) {
    const d = now || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function isDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && toStr(toNum(s)) === s; }

  // ---------- money ----------
  function cents(v) { // accepts number or text like "1,234.5"; returns integer cents or null
    if (typeof v === 'number') return isFinite(v) ? Math.round(v * 100) : null;
    if (typeof v !== 'string') return null;
    const t = v.replace(/[^0-9.\-]/g, '');
    if (!t || t === '-' || t === '.' || (t.match(/\./g) || []).length > 1) return null;
    const n = Number(t); return isFinite(n) ? Math.round(n * 100) : null;
  }
  const MAX = 99999999999; // $999,999,999.99 cap
  function clampMoney(c) { c = Math.round(Number(c) || 0); return Math.max(-MAX, Math.min(MAX, c)); }

  // ---------- paydays ----------
  function earlyIfWeekend(s, on) { if (!on) return s; const w = dow(s); return w === 6 ? addDays(s, -1) : w === 0 ? addDays(s, -2) : s; }
  // All payday dates in [from, to] (inclusive), from the pay settings.
  function paydays(pay, from, to) {
    const out = []; if (!pay || !isDate(pay.anchor)) return out;
    const f = pay.freq;
    if (f === 'weekly' || f === 'biweekly') {
      const step = f === 'weekly' ? 7 : 14; let k = Math.floor(diff(from, pay.anchor) / step) - 1; let d;
      for (let i = 0; i < 2000; i++, k++) { d = addDays(pay.anchor, k * step); const e = earlyIfWeekend(d, pay.early); if (e > to) break; if (e >= from) out.push(e); }
    } else if (f === 'monthly' || f === 'semimonthly') {
      const days = f === 'monthly' ? [Number(pay.day || pay.anchor.slice(8))] : (pay.days || [1, 15]).map(Number).sort((a, b) => a - b);
      let [y, m] = ym(from); y = m === 1 ? y - 1 : y; m = m === 1 ? 12 : m - 1;
      for (let i = 0; i < 400; i++, m++) {
        for (const dd of days) { const e = earlyIfWeekend(dateOf(y, m, dd), pay.early); if (e >= from && e <= to && !out.includes(e)) out.push(e); }
        if (dateOf(y, m, 1) > to) break;
      }
      out.sort();
    } else if (f === 'irregular') {
      // no schedule: the buyer picks a "plan until" date (pay.anchor)
      if (pay.anchor >= from && pay.anchor <= to) out.push(pay.anchor);
    }
    return out;
  }
  function nextPayday(pay, today) { // first payday strictly after today
    if (pay && pay.freq === 'irregular') { if (!isDate(pay.anchor)) return addDays(today, 14); if (pay.anchor > today) return pay.anchor; const k = Math.floor(diff(today, pay.anchor) / 14) + 1; return addDays(pay.anchor, k * 14); }
    const list = paydays(pay, addDays(today, 1), addDays(today, 400));
    return list[0] || addDays(today, 14);
  }
  function lastPayday(pay, today) { // most recent payday on or before today
    if (pay && pay.freq === 'irregular') { if (!isDate(pay.anchor) || pay.anchor > today) return isDate(pay.from) && pay.from <= today ? pay.from : null; const k = Math.floor(diff(today, pay.anchor) / 14); return addDays(pay.anchor, k * 14); }
    const list = paydays(pay, addDays(today, -400), today);
    return list.length ? list[list.length - 1] : null;
  }
  function threePaycheckMonths(pay, today, months) {
    if (!pay || (pay.freq !== 'weekly' && pay.freq !== 'biweekly')) return [];
    const list = paydays(pay, today, addDays(today, 31 * (months || 12)));
    const by = {}; list.forEach(d => { const k = d.slice(0, 7); by[k] = (by[k] || 0) + 1; });
    const lim = pay.freq === 'biweekly' ? 3 : 5;
    return Object.keys(by).filter(k => by[k] >= lim);
  }

  // ---------- bills ----------
  // bill: {id,name,amount(cents),freq:'monthly'|'weekly'|'biweekly'|'months'|'yearly'|'once', anchor:'YYYY-MM-DD', every:n (for 'months'), fund:bool}
  function billDates(b, from, to) {
    const out = []; if (!b || !isDate(b.anchor) || from > to) return out;
    const f = b.freq;
    if (f === 'once') { if (b.anchor >= from && b.anchor <= to) out.push(b.anchor); return out; }
    if (f === 'weekly' || f === 'biweekly') {
      const step = f === 'weekly' ? 7 : 14; let k = Math.max(0, Math.floor(diff(from, b.anchor) / step));
      for (let i = 0; i < 2000; i++, k++) { const d = addDays(b.anchor, k * step); if (d > to) break; if (d >= from && d >= b.anchor) out.push(d); }
      return out;
    }
    const every = f === 'monthly' ? 1 : f === 'yearly' ? 12 : Math.max(1, Math.min(24, Number(b.every) || 1));
    const [ay, am] = ym(b.anchor); const day = Number(b.day || b.anchor.slice(8));
    let [fy, fm] = ym(from); let k = Math.max(0, Math.floor(((fy - ay) * 12 + (fm - am)) / every) - 1);
    for (let i = 0; i < 1000; i++, k++) { const d = dateOf(ay, am + k * every, day); if (d > to) break; if (d >= from && d >= b.anchor) out.push(d); }
    return out;
  }
  function occurrencesPerYear(b) {
    return { weekly: 52, biweekly: 26, monthly: 12, yearly: 1, once: 0 }[b.freq] ?? (12 / Math.max(1, Number(b.every) || 1));
  }
  function paysPerYear(pay) { return { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 }[pay && pay.freq] || 26; }
  // Big non-monthly bills (every 2+ months, yearly) can be "funded": a share is set aside each payday.
  function isFundable(b) { return b.freq === 'yearly' || (b.freq === 'months' && Number(b.every) >= 2); }
  function fundShare(b, pay) { // cents per payday
    if (!b.fund || !isFundable(b)) return 0;
    return Math.ceil(b.amount * occurrencesPerYear(b) / paysPerYear(pay));
  }

  // ---------- pots and auto entries ----------
  // Materialize automatic events up to today: paycheck on each payday, pot contributions, bill-fund contributions.
  // Returns list of new entries (does not mutate). Key = stable id so nothing is added twice.
  function autoEntries(state, today) {
    const s = state, out = [], have = new Set((s.entries || []).map(e => e.id));
    if (!s.pay || !s.settings || !isDate(s.settings.startDate)) return out;
    const from = addDays(s.settings.startDate, 1); // paydays after setup day
    if (from > today) return out;
    const days = s.pay.freq === 'irregular' ? [] : paydays(s.pay, from, today);
    for (const d of days) {
      if (s.pay.amount > 0 && s.pay.auto !== false) {
        const id = 'pay-' + d; if (!have.has(id)) out.push({ id, date: d, type: 'in', amount: s.pay.amount, cat: 'Paycheck', note: 'Paycheck', auto: true });
      }
      for (const p of s.pots || []) {
        const id = 'pot-' + p.id + '-' + d; if (have.has(id) || !(p.perPay > 0) || (isDate(p.since) && d <= p.since)) continue;
        const saved = potSaved(s, p.id, out); const room = p.target > 0 ? Math.max(0, p.target - saved) : p.perPay;
        const amt = Math.min(p.perPay, room); if (amt > 0) out.push({ id, date: d, type: 'pot', potId: p.id, amount: amt, auto: true });
      }
      for (const b of s.bills || []) {
        const sh = fundShare(b, s.pay); const id = 'fund-' + b.id + '-' + d; if (sh > 0 && !have.has(id) && !(isDate(b.fundSince) && d <= b.fundSince)) out.push({ id, date: d, type: 'fund', billId: b.id, amount: sh, auto: true });
      }
    }
    return out;
  }
  function potSaved(s, potId, extra) {
    let t = 0; for (const e of (s.entries || []).concat(extra || [])) { if (e.type === 'pot' && e.potId === potId) t += e.amount; if (e.type === 'spend' && e.potId === potId) t -= e.amount; }
    const p = (s.pots || []).find(x => x.id === potId); return Math.max(0, t + ((p && p.start) || 0));
  }
  function fundSaved(s, billId) {
    let t = 0; for (const e of s.entries || []) { if (e.type === 'fund' && e.billId === billId) t += e.amount; if (e.type === 'billpay' && e.billId === billId && e.fromFund) t -= e.fromFund; }
    const b = (s.bills || []).find(x => x.id === billId); return Math.max(0, t + ((b && b.fundStart) || 0));
  }

  // ---------- balance ----------
  function balance(s) { // everyday account
    let t = (s.settings && s.settings.startBalance) || 0;
    for (const e of s.entries || []) {
      if (e.type === 'in') t += e.amount;
      else if (e.type === 'spend' || e.type === 'billpay') t -= e.amount;
      else if (e.type === 'adjust') t += e.amount;
    }
    return clampMoney(t);
  }
  function paidKeys(s) { const k = new Set(); for (const e of s.entries || []) if (e.type === 'billpay' && e.billId && e.due) k.add(e.billId + '|' + e.due); return k; }

  // ---------- debts ----------
  // debt: {id,name,balance,rate (APR %),min (cents/month),day}
  function debtPlan(debts, order, extra, startYm) {
    const list = (debts || []).filter(d => d.balance > 0).map(d => ({ id: d.id, name: d.name, bal: d.balance, r: Math.max(0, Number(d.rate) || 0) / 1200, min: Math.max(0, d.min || 0), paidOff: null, interest: 0 }));
    if (!list.length) return { months: 0, list: [], ok: true };
    const sorter = order === 'rate' ? (a, b) => b.r - a.r || a.bal - b.bal : (a, b) => a.bal - b.bal || b.r - a.r;
    let month = 0, budget = list.reduce((t, d) => t + d.min, 0) + Math.max(0, extra || 0), ok = true;
    for (const d of list) if (d.min > 0 && d.min <= Math.round(d.bal * d.r)) { /* minimum below interest */ }
    while (list.some(d => d.bal > 0) && month < 600) {
      month++;
      for (const d of list) if (d.bal > 0) { const i = Math.round(d.bal * d.r); d.bal += i; d.interest += i; }
      let pool = budget; const active = list.filter(d => d.bal > 0).sort(sorter);
      for (const d of active) { const p = Math.min(d.min, d.bal, pool); d.bal -= p; pool -= p; }
      for (const d of active) { if (pool <= 0) break; const p = Math.min(d.bal, pool); d.bal -= p; pool -= p; }
      for (const d of list) if (d.bal <= 0 && d.paidOff === null) d.paidOff = month;
    }
    if (list.some(d => d.bal > 0)) ok = false;
    const [y, m] = startYm || [2026, 1];
    const lab = n => { const mm = m + n - 1; const yy = y + Math.floor((mm - 1) / 12); return yy + '-' + pad(((mm - 1) % 12) + 1); };
    return { ok, months: ok ? month : null, freeYm: ok ? lab(month) : null, list: list.map(d => ({ id: d.id, name: d.name, months: d.paidOff, ym: d.paidOff ? lab(d.paidOff) : null, interest: d.interest })) };
  }

  // ---------- the number ----------
  function compute(state, today) {
    const s = state; const set = s.settings || {}; const ws = set.weekStart === 0 ? 0 : 1;
    const next = nextPayday(s.pay, today);
    const last = lastPayday(s.pay, today);
    const start = isDate(set.startDate) ? set.startDate : today;
    const periodStart = [last, start].filter(Boolean).sort().pop(); // later of last payday and setup day
    const bal = balance(s);
    // bills due in this pay period (from period start until the day before next payday), not paid, not covered by a fund
    const paid = paidKeys(s); const due = [];
    for (const b of s.bills || []) {
      for (const d of billDates(b, periodStart, addDays(next, -1))) {
        if (paid.has(b.id + '|' + d)) continue;
        let amt = b.amount;
        if (b.fund && isFundable(b)) { amt = Math.max(0, amt - fundSaved(s, b.id)); }
        if (amt > 0) due.push({ billId: b.id, name: b.name, date: d, amount: amt, full: b.amount });
      }
    }
    for (const d of s.debts || []) { // minimum payments behave like monthly bills
      if (!(d.min > 0) || !(d.balance > 0) || !d.day) continue;
      const st = isDate(set.startDate) ? set.startDate : today;
      const pseudo = { id: 'debt:' + d.id, freq: 'monthly', anchor: dateOf(Number(st.slice(0, 4)), Number(st.slice(5, 7)) - 1, Number(d.day)), day: Number(d.day) };
      for (const dd of billDates(pseudo, periodStart, addDays(next, -1))) if (!paid.has(pseudo.id + '|' + dd)) due.push({ billId: pseudo.id, name: d.name + ' (minimum)', date: dd, amount: Math.min(d.min, d.balance), debt: true });
    }
    due.sort((a, b) => a.date < b.date ? -1 : 1);
    const billsDue = due.reduce((t, x) => t + x.amount, 0);
    const potsTotal = (s.pots || []).reduce((t, p) => t + potSaved(s, p.id), 0);
    const fundsTotal = (s.bills || []).filter(b => b.fund && isFundable(b)).reduce((t, b) => t + fundSaved(s, b.id), 0);
    const setAside = potsTotal + fundsTotal;
    const untilPayday = clampMoney(bal - billsDue - setAside);

    // week
    const off = (dow(today) - ws + 7) % 7; const weekStart = addDays(today, -off); const weekEnd = addDays(weekStart, 6);
    const wStartEff = weekStart > periodStart ? weekStart : periodStart;
    const spentWeek = (s.entries || []).filter(e => e.type === 'spend' && !e.potId && e.date >= wStartEff && e.date <= today).reduce((t, e) => t + e.amount, 0);
    const availAtWeekStart = untilPayday + spentWeek;
    const daysFromWS = Math.max(1, diff(next, wStartEff));
    const weekEndEff = addDays(next, -1) < weekEnd ? addDays(next, -1) : weekEnd;
    const weekDays = Math.max(1, diff(weekEndEff, wStartEff) + 1);
    const weekBudget = availAtWeekStart > 0 ? Math.round(availAtWeekStart * weekDays / daysFromWS) : 0;
    const thisWeek = weekBudget - spentWeek; // may be negative
    const daysLeftWeek = Math.max(1, diff(weekEndEff, today) + 1);
    const daysToPayday = Math.max(1, diff(next, today));
    const perDayWeek = thisWeek > 0 ? Math.floor(thisWeek / daysLeftWeek) : 0;
    return {
      today, next, last, periodStart, weekStart, weekEnd, weekEndEff, balance: bal, due, billsDue, potsTotal, fundsTotal, setAside,
      untilPayday, spentWeek, weekBudget, thisWeek, show: Math.max(0, thisWeek), past: thisWeek < 0 ? -thisWeek : 0,
      perDay: perDayWeek, daysLeftWeek, daysToPayday, weekDays, crossesPayday: addDays(next, -1) < weekEnd
    };
  }

  const api = { DAY, pad, toNum, toStr, addDays, diff, dow, dateOf, daysInMonth, localToday, isDate, cents, clampMoney, MAX,
    paydays, nextPayday, lastPayday, threePaycheckMonths, billDates, isFundable, fundShare, autoEntries, potSaved, fundSaved,
    balance, paidKeys, debtPlan, compute, paysPerYear, occurrencesPerYear };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CWEngine = api;
})(typeof self !== 'undefined' ? self : this);
