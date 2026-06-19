import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCompatView } from '../js/app/compatView.mjs';

const result = {
  stars: 3, total: 3, band: 'good',
  aspects: {
    dayStem: { relation: '相剋' },
    dayBranch: { relation: '中立' },
    element: { relation: 'oneway' },
  },
};

test('★・総合コメント・3観点の文言が組み立つ', () => {
  const v = buildCompatView(result);
  assert.equal(v.stars, 3);
  assert.ok(v.comment.length > 0);
  assert.equal(v.aspects.length, 3);
  assert.deepEqual(v.aspects.map(a => a.title), ['惹かれ合い', '生活の噛み合い', '補い合い']);
  assert.ok(v.aspects[0].label.length > 0);
  assert.ok(v.aspects[0].note.length > 0);
});
