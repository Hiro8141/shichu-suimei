import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildViewModel } from '../js/app/viewModel.mjs';

const meishiki = {
  dayMaster: '庚', hasHourPillar: false,
  pillars: {
    year:  { stem: '庚', branch: '午', tenStar: '比肩', twelveStage: '沐浴' },
    month: { stem: '壬', branch: '午', tenStar: '食神', twelveStage: '沐浴' },
    day:   { stem: '庚', branch: '申', tenStar: null,   twelveStage: '建禄' },
    hasHourPillar: false,
  },
  fiveElements: { wood: 0, fire: 2, earth: 0, metal: 3, water: 1 },
};

test('時柱なしのとき列は年月日の3つ', () => {
  const vm = buildViewModel(meishiki, { name: '太郎', year: 1990, month: 6, day: 19 });
  assert.deepEqual(vm.columns, ['年柱', '月柱', '日柱']);
});

test('命式表の行に天干/地支/通変星/十二運がある', () => {
  const vm = buildViewModel(meishiki, { year: 1990, month: 6, day: 19 });
  const labels = vm.tableRows.map(r => r.label);
  assert.deepEqual(labels, ['天干', '地支', '通変星', '十二運']);
  assert.deepEqual(vm.tableRows[0].cells, ['庚', '壬', '庚']);     // 天干
  assert.deepEqual(vm.tableRows[2].cells, ['比肩', '食神', '―']); // 日柱通変星は―
});

test('ヘッダーに日付と日主キャッチが入る', () => {
  const vm = buildViewModel(meishiki, { year: 1990, month: 6, day: 19, hour: 14, minute: 25 });
  assert.match(vm.header.birth, /1990/);
  assert.match(vm.header.catch, /庚/);
});
