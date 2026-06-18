const KEY = 'shichu-suimei.records';

// 既定はブラウザの localStorage。テストでは _setStore で差し替える
let store = (typeof localStorage !== 'undefined') ? localStorage : null;
export function _setStore(s) { store = s; }

function readAll() {
  const raw = store.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
function writeAll(list) {
  store.setItem(KEY, JSON.stringify(list));
}

export function saveRecord(record) {
  const list = readAll();
  const saved = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...record };
  list.push(saved);
  writeAll(list);
  return saved;
}

export function listRecords() {
  return readAll();
}

export function deleteRecord(id) {
  writeAll(readAll().filter(r => r.id !== id));
}
