import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeStrength } from '../js/engine/shinStrength.mjs';

// 日主 甲（木・陽）。各 pillar に本気 hiddenStems を持たせる
test('味方が多く月支が得令なら身強', () => {
  const m = { dayMaster: '甲', hasHourPillar: true, fiveElements: {}, pillars: {
    year:  { stem: '壬', branch: '子', hiddenStems: ['癸'] },
    month: { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
    day:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
    hour:  { stem: '癸', branch: '子', hiddenStems: ['癸'] },
    hasHourPillar: true,
  }};
  const r = judgeStrength(m);
  assert.equal(r.level, '身強');
  assert.equal(r.score, 9);
  assert.equal(r.drain, 0);
});

test('敵が多く月支が失令なら身弱', () => {
  const m = { dayMaster: '甲', hasHourPillar: true, fiveElements: {}, pillars: {
    year:  { stem: '庚', branch: '申', hiddenStems: ['庚','壬','戊'] },
    month: { stem: '丙', branch: '午', hiddenStems: ['丁','己'] },
    day:   { stem: '甲', branch: '戌', hiddenStems: ['戊','辛','丁'] },
    hour:  { stem: '戊', branch: '申', hiddenStems: ['庚','壬','戊'] },
    hasHourPillar: true,
  }};
  const r = judgeStrength(m);
  assert.equal(r.level, '身弱');
  assert.equal(r.score, -9);
  assert.equal(r.support, 0);
});

test('拮抗なら中庸', () => {
  const m = { dayMaster: '甲', hasHourPillar: true, fiveElements: {}, pillars: {
    year:  { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
    month: { stem: '丙', branch: '辰', hiddenStems: ['戊','乙','癸'] },
    day:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
    hour:  { stem: '庚', branch: '子', hiddenStems: ['癸'] },
    hasHourPillar: true,
  }};
  assert.equal(judgeStrength(m).level, '中庸');
});

test('月支の得令/失令だけで判定が反転する', () => {
  const base = (monthBranch, hidden) => ({
    dayMaster: '甲', hasHourPillar: false, fiveElements: {}, pillars: {
      year:  { stem: '甲', branch: '申', hiddenStems: ['庚','壬','戊'] },
      month: { stem: '庚', branch: monthBranch, hiddenStems: hidden },
      day:   { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
      hasHourPillar: false,
    }});
  assert.equal(judgeStrength(base('子', ['癸'])).level, '身強');
  assert.equal(judgeStrength(base('午', ['丁','己'])).level, '身弱');
});

test('時柱なし（3柱）でも集計できる', () => {
  const m = { dayMaster: '甲', hasHourPillar: false, fiveElements: {}, pillars: {
    year:  { stem: '壬', branch: '子', hiddenStems: ['癸'] },
    month: { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
    day:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
    hasHourPillar: false,
  }};
  assert.equal(judgeStrength(m).level, '身強');
});
