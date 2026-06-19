import { buildMeishiki } from '../engine/meishiki.mjs';
import { buildViewModel } from './viewModel.mjs';
import { saveRecord, listRecords, deleteRecord } from './storage.mjs';
import { shareResult } from './shareImage.mjs';
import { radarSvg } from './radarChart.mjs';

const $ = sel => document.querySelector(sel);
const screens = {
  input: $('#screen-input'), result: $('#screen-result'), saved: $('#screen-saved'),
};
function show(name) {
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('hidden', k !== name);
}

let currentVM = null;
let currentBirth = null;

function readBirth() {
  const unknown = $('#in-unknown-time').checked;
  const birth = {
    name: $('#in-name').value.trim(),
    year: +$('#in-year').value,
    month: +$('#in-month').value,
    day: +$('#in-day').value,
  };
  if (!unknown && $('#in-hour').value !== '') {
    birth.hour = +$('#in-hour').value;
    birth.minute = +$('#in-minute').value || 0;
  }
  return birth;
}

function renderResult(vm) {
  const cols = vm.columns.map(c => `<th>${c}</th>`).join('');
  const rows = vm.tableRows.map(r =>
    `<tr><th>${r.label}</th>${r.cells.map(c => `<td>${c}</td>`).join('')}</tr>`
  ).join('');
  const talents = vm.talents.map(t =>
    `<div class="chip"><span>${t.star}</span>${t.talent}</div>`
  ).join('');
  $('#result-root').innerHTML = `
    <div class="result-head">
      <p class="birth">${vm.header.birth}</p>
      <p class="catch">${vm.header.catch}</p>
    </div>
    <div class="meishiki-table card">
      <table><thead><tr><th></th>${cols}</tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="card section"><h3>基本性格</h3><p>${vm.personality}</p></div>
    <div class="card section"><h3>才能・適職</h3>${talents}</div>
    <div class="card section gogyou-section">
      <h3>五行バランス & 身強身弱</h3>
      <div class="radar">${radarSvg(vm.radarCounts)}</div>
      <p class="strength-badge strength-${vm.strength.level}">${vm.strength.level}</p>
      <p>${vm.strength.advice}</p>
      <p class="dominant element-${vm.dominantElement.key}">${vm.dominantElement.text}</p>
      ${vm.lacking.map(l => `<p class="note">${l.text}</p>`).join('')}
    </div>
    ${vm.hasHourPillar ? '' : '<p class="note">出生時間が分かるともっと詳しく占えます。</p>'}
  `;
}

$('#birth-form').addEventListener('submit', e => {
  e.preventDefault();
  const birth = readBirth();
  const meishiki = buildMeishiki(window.Solar, birth);
  currentBirth = birth;
  currentVM = buildViewModel(meishiki, birth);
  renderResult(currentVM);
  show('result');
});

$('#in-unknown-time').addEventListener('change', e => {
  $('#time-row').classList.toggle('hidden', e.target.checked);
});

$('#back-btn').addEventListener('click', () => show('input'));
$('#save-btn').addEventListener('click', () => {
  if (currentBirth) { saveRecord({ name: currentBirth.name, birth: currentBirth }); alert('保存しました'); }
});
$('#share-btn').addEventListener('click', () => shareResult(currentVM, $('#result-root')));

function renderSaved() {
  const list = listRecords();
  $('#saved-list').innerHTML = list.length
    ? list.map(r => `<li data-id="${r.id}"><span>${r.name || '（無名）'} ・ ${r.birth.year}/${r.birth.month}/${r.birth.day}</span>
        <button class="open">ひらく</button><button class="del">削除</button></li>`).join('')
    : '<li class="empty">まだ保存がありません</li>';
}
$('#open-saved').addEventListener('click', () => { renderSaved(); show('saved'); });
$('#saved-back-btn').addEventListener('click', () => show('input'));
$('#saved-list').addEventListener('click', e => {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = li.dataset.id;
  const rec = listRecords().find(r => r.id === id);
  if (e.target.classList.contains('del')) { deleteRecord(id); renderSaved(); }
  else if (e.target.classList.contains('open')) {
    const meishiki = buildMeishiki(window.Solar, rec.birth);
    currentBirth = rec.birth;
    currentVM = buildViewModel(meishiki, rec.birth);
    renderResult(currentVM); show('result');
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
