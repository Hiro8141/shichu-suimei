import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeYojin } from '../js/engine/yojin.mjs';

const weak = { dayMaster: '庚', pillars: {
  year:  { stem: '庚', branch: '午', hiddenStems: ['丁','己'] },
  month: { stem: '壬', branch: '午', hiddenStems: ['丁','己'] },
  day:   { stem: '庚', branch: '申', hiddenStems: ['庚','壬','戊'] },
  hasHourPillar: false,
}};
const strong = { dayMaster: '甲', pillars: {
  year:  { stem: '壬', branch: '子', hiddenStems: ['癸'] },
  month: { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
  day:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
  hour:  { stem: '癸', branch: '子', hiddenStems: ['癸'] },
  hasHourPillar: true,
}};
const mid = { dayMaster: '甲', pillars: {
  year:  { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
  month: { stem: '丙', branch: '辰', hiddenStems: ['戊','乙','癸'] },
  day:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
  hour:  { stem: '庚', branch: '子', hiddenStems: ['癸'] },
  hasHourPillar: true,
}};

test('身弱は日主を生む五行が用神（庚→土）', () => {
  const y = judgeYojin(weak);
  assert.equal(y.level, '身弱');
  assert.equal(y.element, 'earth');
  assert.equal(y.elementName, '土');
  assert.equal(y.color, '黄・茶');
  assert.equal(y.direction, '中央');
});

test('身強は日主が生む五行が用神（甲→火）', () => {
  const y = judgeYojin(strong);
  assert.equal(y.level, '身強');
  assert.equal(y.element, 'fire');
  assert.equal(y.color, '赤');
  assert.equal(y.direction, '南');
});

test('中庸は日主と同じ五行が用神（甲→木）', () => {
  const y = judgeYojin(mid);
  assert.equal(y.level, '中庸');
  assert.equal(y.element, 'wood');
  assert.equal(y.direction, '東');
});

test('相性の一文が用神の和名を含む', () => {
  const y = judgeYojin(weak);
  assert.ok(y.affinity.includes('土'));
});
