import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpret } from '../js/data/interpret.mjs';

// 日主 庚。各地支に本気 hiddenStems を付与（身強身弱判定に必要）
const sampleMeishiki = {
  dayMaster: '庚',
  hasHourPillar: false,
  pillars: {
    year:  { stem: '庚', branch: '午', hiddenStems: ['丁','己'], tenStar: '比肩', twelveStage: '沐浴' },
    month: { stem: '壬', branch: '午', hiddenStems: ['丁','己'], tenStar: '食神', twelveStage: '沐浴' },
    day:   { stem: '庚', branch: '申', hiddenStems: ['庚','壬','戊'], tenStar: null, twelveStage: '建禄' },
    hasHourPillar: false,
  },
  fiveElements: { wood: 0, fire: 2, earth: 0, metal: 3, water: 1 },
};

test('日主の基本性格文が含まれる', () => {
  const r = interpret(sampleMeishiki);
  assert.equal(r.dayMaster.label, '庚（かのえ）');
  assert.ok(r.dayMaster.personality.length > 0);
});

test('通変星から才能/適職が拾われる（日柱は除外）', () => {
  const r = interpret(sampleMeishiki);
  const stars = r.talents.map(t => t.star);
  assert.ok(stars.includes('比肩'));
  assert.ok(stars.includes('食神'));
  assert.ok(!stars.includes(null));
});

test('最も多い五行の傾向文が出る', () => {
  const r = interpret(sampleMeishiki);
  assert.equal(r.dominantElement.key, 'metal');
  assert.ok(r.dominantElement.text.length > 0);
});

test('身強身弱の判定とアドバイス文が出る', () => {
  const r = interpret(sampleMeishiki);
  assert.equal(r.strength.level, '身弱');
  assert.ok(r.strength.advice.length > 0);
});

test('不足している五行のコメントが出る', () => {
  const r = interpret(sampleMeishiki);
  const keys = r.lackingElements.map(l => l.key);
  assert.ok(keys.includes('wood'));
  assert.ok(keys.includes('earth'));
  assert.ok(r.lackingElements.every(l => l.text.length > 0));
});
