import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEMS, BRANCHES, STEM_INFO, HIDDEN_STEMS } from '../js/engine/tables.mjs';

test('十干・十二支が正しい順序で定義されている', () => {
  assert.deepEqual(STEMS, ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']);
  assert.deepEqual(BRANCHES, ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);
});

test('日干の五行・陰陽が引ける', () => {
  assert.deepEqual(STEM_INFO['庚'], { element: 'metal', yin: false });
  assert.deepEqual(STEM_INFO['乙'], { element: 'wood', yin: true });
});

test('蔵干（本気）が引ける', () => {
  assert.equal(HIDDEN_STEMS['子'][0], '癸');
  assert.equal(HIDDEN_STEMS['寅'][0], '甲');
});

import pkg from 'lunar-javascript';
import { computePillars } from '../js/engine/pillars.mjs';
const { Solar } = pkg;

test('時刻ありの命式で4柱の干支が出る', () => {
  // 1990-06-19 14:25 生まれ
  const p = computePillars(Solar, { year: 1990, month: 6, day: 19, hour: 14, minute: 25 });
  assert.equal(p.year.stem + p.year.branch, '庚午');
  assert.equal(p.day.stem.length, 1);   // 日柱の天干が1文字
  assert.ok(p.hour, '時柱が存在する');
  assert.equal(p.hasHourPillar, true);
});

test('時刻なしなら時柱を省略する', () => {
  const p = computePillars(Solar, { year: 1990, month: 6, day: 19 });
  assert.equal(p.hour, undefined);
  assert.equal(p.hasHourPillar, false);
  assert.ok(p.year && p.month && p.day);
});

test('立春前後で年柱が切り替わる', () => {
  // 2024 立春は 2/4。2/3 はまだ前年(癸卯)、2/5 は甲辰
  const before = computePillars(Solar, { year: 2024, month: 2, day: 3, hour: 12, minute: 0 });
  const after  = computePillars(Solar, { year: 2024, month: 2, day: 5, hour: 12, minute: 0 });
  assert.equal(before.year.stem + before.year.branch, '癸卯');
  assert.equal(after.year.stem + after.year.branch, '甲辰');
});
