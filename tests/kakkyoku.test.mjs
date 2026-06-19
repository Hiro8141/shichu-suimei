import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeKakkyoku } from '../js/engine/kakkyoku.mjs';

const mk = (dayMaster, monthHonki) => ({ dayMaster, pillars: { month: { hiddenStems: [monthHonki] } } });

test('月支本気が比肩なら建禄格', () => {
  assert.deepEqual(judgeKakkyoku(mk('甲', '甲')), { name: '建禄格', star: '比肩' });
});

test('月支本気が劫財なら月刃格', () => {
  assert.deepEqual(judgeKakkyoku(mk('甲', '乙')), { name: '月刃格', star: '劫財' });
});

test('それ以外は通変星＋格（食神→食神格）', () => {
  assert.deepEqual(judgeKakkyoku(mk('乙', '丁')), { name: '食神格', star: '食神' });
});

test('正官は正官格', () => {
  assert.deepEqual(judgeKakkyoku(mk('庚', '丁')), { name: '正官格', star: '正官' });
});
