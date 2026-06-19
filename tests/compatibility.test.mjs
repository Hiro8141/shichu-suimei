import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayStemRelation, dayBranchRelation, compareCompatibility } from '../js/engine/compatibility.mjs';

test('日干関係：干合・比和・相生・相剋', () => {
  assert.equal(dayStemRelation('甲', '己'), '干合');
  assert.equal(dayStemRelation('甲', '甲'), '比和');
  assert.equal(dayStemRelation('甲', '丙'), '相生');
  assert.equal(dayStemRelation('甲', '庚'), '相剋');
});

test('日支関係：六合・七冲・中立', () => {
  assert.equal(dayBranchRelation('子', '丑'), '六合');
  assert.equal(dayBranchRelation('子', '午'), '七冲');
  assert.equal(dayBranchRelation('子', '寅'), '中立');
});

const self = { dayMaster: '甲', pillars: {
  year:  { stem: '壬', branch: '子', hiddenStems: ['癸'] },
  month: { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
  day:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
  hour:  { stem: '癸', branch: '子', hiddenStems: ['癸'] },
  hasHourPillar: true,
}, fiveElements: { wood: 4, fire: 0, earth: 0, metal: 0, water: 4 } };
const partner = { dayMaster: '庚', pillars: {
  year:  { stem: '庚', branch: '午', hiddenStems: ['丁','己'] },
  month: { stem: '壬', branch: '午', hiddenStems: ['丁','己'] },
  day:   { stem: '庚', branch: '申', hiddenStems: ['庚','壬','戊'] },
  hasHourPillar: false,
}, fiveElements: { wood: 0, fire: 2, earth: 0, metal: 3, water: 1 } };

test('総合：相剋・中立・片補完で★3 good', () => {
  const r = compareCompatibility(self, partner);
  assert.equal(r.aspects.dayStem.relation, '相剋');
  assert.equal(r.aspects.dayBranch.relation, '中立');
  assert.equal(r.aspects.element.relation, 'oneway');
  assert.equal(r.total, 3);
  assert.equal(r.stars, 3);
  assert.equal(r.band, 'good');
});
