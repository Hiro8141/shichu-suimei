import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpret } from '../js/data/interpret.mjs';

const sampleMeishiki = {
  dayMaster: '庚',
  hasHourPillar: false,
  pillars: {
    year:  { stem: '庚', branch: '午', tenStar: '比肩', twelveStage: '沐浴' },
    month: { stem: '壬', branch: '午', tenStar: '食神', twelveStage: '沐浴' },
    day:   { stem: '庚', branch: '申', tenStar: null,   twelveStage: '建禄' },
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
  assert.ok(!stars.includes(null)); // 日柱はnullなので入らない
});

test('最も多い五行の傾向文が出る', () => {
  const r = interpret(sampleMeishiki);
  assert.equal(r.dominantElement.key, 'metal');
  assert.ok(r.dominantElement.text.length > 0);
});
