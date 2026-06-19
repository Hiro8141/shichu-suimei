import { test } from 'node:test';
import assert from 'node:assert/strict';
import pkg from 'lunar-javascript';
import { computeLuckCycles } from '../js/engine/luck.mjs';
const { Solar } = pkg;

const birth = { year: 1990, month: 6, day: 19, hour: 14, minute: 25 };
const NOW = new Date('2026-06-19T12:00:00');

test('男性：先頭大運の干支・年齢・通変星・年運10年', () => {
  const r = computeLuckCycles(Solar, { ...birth, gender: 'male' }, '乙', NOW);
  assert.equal(r.daYun[0].ganZhi, '癸未');
  assert.equal(r.daYun[0].startAge, 7);
  assert.equal(r.daYun[0].startYear, 1996);
  assert.equal(r.daYun[0].tenStar, '偏印');
  assert.equal(r.daYun[0].liuNian.length, 10);
  assert.equal(r.daYun[0].liuNian[0].year, 1996);
});

test('女性：順逆が反転し先頭大運が変わる', () => {
  const r = computeLuckCycles(Solar, { ...birth, gender: 'female' }, '乙', NOW);
  assert.equal(r.daYun[0].ganZhi, '辛巳');
  assert.equal(r.daYun[0].tenStar, '偏官');
});

test('現在(2026)の大運と年運に isCurrent が1つだけ立つ', () => {
  const r = computeLuckCycles(Solar, { ...birth, gender: 'male' }, '乙', NOW);
  assert.equal(r.daYun.filter(d => d.isCurrent).length, 1);
  const cur = r.daYun.find(d => d.isCurrent);
  assert.equal(cur.ganZhi, '丙戌');
  assert.equal(cur.startYear, 2026);
  const curYear = cur.liuNian.find(y => y.isCurrent);
  assert.equal(curYear.year, 2026);
});

test('起運前 da[0] は除外される（全大運の干支が2文字）', () => {
  const r = computeLuckCycles(Solar, { ...birth, gender: 'male' }, '乙', NOW);
  assert.ok(r.daYun.length >= 8);
  assert.ok(r.daYun.every(d => d.ganZhi.length === 2));
});

test('性別が無ければ null を返す', () => {
  assert.equal(computeLuckCycles(Solar, birth, '乙', NOW), null);
});
