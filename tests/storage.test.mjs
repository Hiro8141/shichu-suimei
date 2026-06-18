import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { saveRecord, listRecords, deleteRecord, _setStore } from '../js/app/storage.mjs';

// localStorage を模した簡易ストア
beforeEach(() => {
  const map = new Map();
  _setStore({
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  });
});

test('保存した記録を一覧で取得できる', () => {
  saveRecord({ name: '太郎', birth: { year: 1990, month: 6, day: 19 } });
  const list = listRecords();
  assert.equal(list.length, 1);
  assert.equal(list[0].name, '太郎');
  assert.ok(list[0].id);
});

test('idで削除できる', () => {
  const rec = saveRecord({ name: '花子', birth: { year: 2000, month: 1, day: 1 } });
  deleteRecord(rec.id);
  assert.equal(listRecords().length, 0);
});
