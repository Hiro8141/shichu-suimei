import { test } from 'node:test';
import assert from 'node:assert/strict';
import { twelveStage } from '../js/engine/twelveStage.mjs';

test('陽干 甲は亥で長生、午で死', () => {
  assert.equal(twelveStage('甲', '亥'), '長生');
  assert.equal(twelveStage('甲', '午'), '死');
});
test('陽干 庚は巳で長生、申で建禄', () => {
  assert.equal(twelveStage('庚', '巳'), '長生');
  assert.equal(twelveStage('庚', '申'), '建禄');
});
test('陰干 乙は午で長生（逆行）、寅で帝旺', () => {
  assert.equal(twelveStage('乙', '午'), '長生');
  assert.equal(twelveStage('乙', '寅'), '帝旺');
});
