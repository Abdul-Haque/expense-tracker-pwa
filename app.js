'use strict';
// ---- State & storage ----
const KEY = 'expense-tracker.v1';
const CATS = {
  expense: ['Food', 'Transport', 'Bills', 'Shopping', 'Education', 'Health', 'Other'],
  income: ['Salary', 'Freelance', 'Gift', 'Other'],
};
const $ = (s) => document.querySelector(s);
let items = load();
let editId = null;

function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(d) ? d : []; }
  catch { return []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); }
  catch { alert('Could not save data. Browser storage may be full or blocked.'); }
}
const money = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

// ---- Form ----
function fillCategories() {
  const sel = $('#category');
  sel.replaceChildren(...CATS[$('#type').value].map((c) => new Option(c, c)));
}
function resetForm() {
  editId = null;
  $('#form').reset();
  $('#date').value = today();
  fillCategories();
  $('#formTitle').textContent = 'Add Transaction';
  $('#saveBtn').textContent = 'Add';
  $('#cancelBtn').hidden = true;
  $('#error').textContent = '';
}
$('#type').addEventListener('change', fillCategories);
$('#cancelBtn').addEventListener('click', resetForm);

$('#form').addEventListener('submit', (e) => {
  e.preventDefault();
  const amount = parseFloat($('#amount').value);
  const date = $('#date').value;
  if (!(amount > 0)) { $('#error').textContent = 'Enter an amount greater than 0.'; return; }
  if (!date) { $('#error').textContent = 'Please choose a date.'; return; }
  const entry = { type: $('#type').value, amount, category: $('#category').value, date, note: $('#note').value.trim() };
  if (editId) items = items.map((i) => (i.id === editId ? { ...entry, id: editId } : i));
  else items.push({ ...entry, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) });
  save();
  $('#month').value = date.slice(0, 7); // show the month of the entry just saved
  resetForm();
  render();
});

function startEdit(item) {
  editId = item.id;
  $('#type').value = item.type; fillCategories();
  $('#category').value = item.category;
  $('#amount').value = item.amount; $('#date').value = item.date; $('#note').value = item.note;
  $('#formTitle').textContent = 'Edit Transaction';
  $('#saveBtn').textContent = 'Update';
  $('#cancelBtn').hidden = false;
  $('#form').scrollIntoView({ behavior: 'smooth' });
}

// ---- Rendering (textContent only, so user text is never injected as HTML) ----
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function render() {
  const month = $('#month').value;
  const list = items.filter((i) => i.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
  const sum = (t) => list.filter((i) => i.type === t).reduce((s, i) => s + i.amount, 0);
  const inc = sum('income'), exp = sum('expense');
  $('#sumIncome').textContent = money(inc);
  $('#sumExpense').textContent = money(exp);
  $('#sumBalance').textContent = money(inc - exp);

  const by = {};
  list.filter((i) => i.type === 'expense').forEach((i) => (by[i.category] = (by[i.category] || 0) + i.amount));
  const bd = $('#breakdown'); bd.replaceChildren();
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]);
  if (!rows.length) bd.append(el('p', 'empty', 'No expenses this month.'));
  rows.forEach(([cat, v]) => {
    const pct = Math.round((v / exp) * 100);
    const top = el('div', 'bar-top'); top.append(el('span', '', cat), el('span', '', `${money(v)} (${pct}%)`));
    const fill = el('div', 'fill'); fill.style.width = pct + '%';
    const track = el('div', 'track'); track.append(fill);
    const bar = el('div', 'bar'); bar.append(top, track);
    bd.append(bar);
  });

  const ul = $('#list'); ul.replaceChildren();
  if (!list.length) ul.append(el('li', 'empty', 'No transactions for this month yet.'));
  list.forEach((i) => {
    const meta = el('div', 'meta'); meta.append(el('b', '', i.category), el('small', '', `${i.date}${i.note ? ' · ' + i.note : ''}`));
    const amt = el('span', 'amt ' + i.type, (i.type === 'income' ? '+' : '-') + money(i.amount));
    const edit = el('button', '', 'Edit'); edit.addEventListener('click', () => startEdit(i));
    const del = el('button', '', 'Delete'); del.addEventListener('click', () => {
      if (confirm('Delete this transaction?')) { items = items.filter((x) => x.id !== i.id); save(); render(); }
    });
    const acts = el('div', 'acts'); acts.append(edit, del);
    const li = el('li'); li.append(meta, amt, acts);
    ul.append(li);
  });
}
$('#month').addEventListener('change', render);

// ---- CSV export (cells starting with = + - @ are prefixed to prevent spreadsheet formula injection) ----
$('#exportBtn').addEventListener('click', () => {
  const cell = (v) => { let s = String(v); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const rows = [['Date', 'Type', 'Category', 'Amount', 'Note'], ...items.map((i) => [i.date, i.type, i.category, i.amount, i.note])];
  const blob = new Blob([rows.map((r) => r.map(cell).join(',')).join('\n')], { type: 'text/csv' });
  const a = el('a'); a.href = URL.createObjectURL(blob); a.download = 'expenses.csv'; a.click();
  URL.revokeObjectURL(a.href);
});

// ---- PWA: install button + service worker ----
let deferred;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; $('#installBtn').hidden = false; });
$('#installBtn').addEventListener('click', async () => {
  if (!deferred) return;
  deferred.prompt(); await deferred.userChoice; deferred = null; $('#installBtn').hidden = true;
});
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

// ---- Init ----
$('#month').value = today().slice(0, 7);
resetForm();
render();
