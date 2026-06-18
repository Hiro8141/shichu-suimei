import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tenStar } from '../js/engine/tenStar.mjs';

test('同じ五行・同じ陰陽は比肩', () => {
  assert.equal(tenStar('庚', '庚'), '比肩'); // 金陽 vs 金陽
});
test('同じ五行・異なる陰陽は劫財', () => {
  assert.equal(tenStar('庚', '辛'), '劫財'); // 金陽 vs 金陰
});
test('我が生じる関係（金→水）同陰陽は食神', () => {
  assert.equal(tenStar('庚', '壬'), '食神'); // 金陽 → 水陽
});
test('我が生じる関係 異陰陽は傷官', () => {
  assert.equal(tenStar('庚', '癸'), '傷官'); // 金陽 → 水陰
});
test('我が剋す関係（金→木）同陰陽は偏財', () => {
  assert.equal(tenStar('庚', '甲'), '偏財'); // 金陽 剋 木陽
});
test('我が剋す関係 異陰陽は正財', () => {
  assert.equal(tenStar('庚', '乙'), '正財');
});
test('我を剋す関係（火→金）同陰陽は偏官', () => {
  assert.equal(tenStar('庚', '丙'), '偏官'); // 火陽 剋 金陽
});
test('我を剋す関係 異陰陽は正官', () => {
  assert.equal(tenStar('庚', '丁'), '正官');
});
test('我を生じる関係（土→金）同陰陽は偏印', () => {
  assert.equal(tenStar('庚', '戊'), '偏印'); // 土陽 生 金陽
});
test('我を生じる関係 異陰陽は印綬', () => {
  assert.equal(tenStar('庚', '己'), '印綬');
});
