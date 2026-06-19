# 相性診断 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 結果画面から相手の生年月日を入力し、2人の命式を比較して相性（★スコア＋3観点＋総合コメント）を表示する。

**Architecture:** 純ロジックの `compatibility.mjs`（日干関係・日支関係・五行補完を判定しスコア化）と純関数 `compatView.mjs`（文言付与）を追加し、`main.mjs` の結果画面に相手入力ミニフォーム＋相性描画を組み込む。③の `judgeYojin` を再利用。

**Tech Stack:** Vanilla ES modules, `node --test`。既存 `STEM_INFO`/`ELEMENTS`/`judgeYojin`/`buildMeishiki` を再利用。

**Project dir:** `C:\Users\hiroy\Desktop\Claude code\shichu-suimei`（Windows, Bash tool）。全コミット末尾に `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。

**前提（既存コードの事実）:**
- `js/engine/tables.mjs` → `STEM_INFO`（`STEM_INFO['甲']={element:'wood',yin:false}`）、`ELEMENTS=['wood','fire','earth','metal','water']`。
- `js/engine/yojin.mjs` → `judgeYojin(meishiki)` → `{ level, element, ... }`（`element` は五行キー）。内部で `judgeStrength` を呼ぶため、meishiki の各 pillar に `hiddenStems` が必要。
- `meishiki`：`{ dayMaster, pillars:{ day:{ branch, ... }, ... }, fiveElements:{wood,fire,earth,metal,water} }`。
- `js/app/main.mjs`：`buildMeishiki(window.Solar, birth)`、`renderResult(vm)`、モジュール変数 `currentVM`/`currentBirth`/`currentLuck`、`$` ヘルパ。
- 五行サイクル：X が生む = `(X+1)%5`。

---

### Task 1: 相性エンジン `compatibility.mjs`

**Files:** Create `js/engine/compatibility.mjs`, Test `tests/compatibility.test.mjs`.

- [ ] **Step 1: 失敗するテストを書く** — `tests/compatibility.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayStemRelation, dayBranchRelation, compareCompatibility } from '../js/engine/compatibility.mjs';

test('日干関係：干合・比和・相生・相剋', () => {
  assert.equal(dayStemRelation('甲', '己'), '干合'); // 甲己合
  assert.equal(dayStemRelation('甲', '甲'), '比和'); // 同五行
  assert.equal(dayStemRelation('甲', '丙'), '相生'); // 木生火
  assert.equal(dayStemRelation('甲', '庚'), '相剋'); // 金剋木
});

test('日支関係：六合・七冲・中立', () => {
  assert.equal(dayBranchRelation('子', '丑'), '六合');
  assert.equal(dayBranchRelation('子', '午'), '七冲');
  assert.equal(dayBranchRelation('子', '寅'), '中立');
});

// judgeYojin を通すため hiddenStems と fiveElements を持つ完全な meishiki
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
  assert.equal(r.aspects.dayStem.relation, '相剋');   // 甲 vs 庚
  assert.equal(r.aspects.dayBranch.relation, '中立'); // 卯 vs 申
  assert.equal(r.aspects.element.relation, 'oneway'); // 自分の用神=火、相手が火を持つ（一方向）
  assert.equal(r.total, 3);
  assert.equal(r.stars, 3);
  assert.equal(r.band, 'good');
});
```

- [ ] **Step 2: 失敗を確認** — Run: `node --test tests/compatibility.test.mjs` / Expected: FAIL（関数未定義）

- [ ] **Step 3: 実装** — `js/engine/compatibility.mjs`

```js
import { STEM_INFO, ELEMENTS } from './tables.mjs';
import { judgeYojin } from './yojin.mjs';

const GAN_GOU = ['甲己', '乙庚', '丙辛', '丁壬', '戊癸'];
const ROKU_GOU = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'];
const SHICHI_CHU = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
const hasPair = (list, a, b) => list.includes(a + b) || list.includes(b + a);

export function dayStemRelation(a, b) {
  if (hasPair(GAN_GOU, a, b)) return '干合';
  const ea = ELEMENTS.indexOf(STEM_INFO[a].element);
  const eb = ELEMENTS.indexOf(STEM_INFO[b].element);
  if (ea === eb) return '比和';
  if ((ea + 1) % 5 === eb || (eb + 1) % 5 === ea) return '相生';
  return '相剋';
}

export function dayBranchRelation(a, b) {
  if (hasPair(ROKU_GOU, a, b)) return '六合';
  if (hasPair(SHICHI_CHU, a, b)) return '七冲';
  return '中立';
}

export function elementComplement(self, partner) {
  const selfYojin = judgeYojin(self).element;
  const partnerYojin = judgeYojin(partner).element;
  const partnerSupportsSelf = (partner.fiveElements[selfYojin] || 0) > 0;
  const selfSupportsPartner = (self.fiveElements[partnerYojin] || 0) > 0;
  if (partnerSupportsSelf && selfSupportsPartner) return 'mutual';
  if (partnerSupportsSelf || selfSupportsPartner) return 'oneway';
  return 'none';
}

const STEM_POINTS = { '干合': 2, '比和': 2, '相生': 2, '相剋': 1 };
const BRANCH_POINTS = { '六合': 2, '中立': 1, '七冲': 0 };
const ELEMENT_POINTS = { mutual: 2, oneway: 1, none: 0 };

export function compareCompatibility(self, partner) {
  const dayStem = dayStemRelation(self.dayMaster, partner.dayMaster);
  const dayBranch = dayBranchRelation(self.pillars.day.branch, partner.pillars.day.branch);
  const element = elementComplement(self, partner);
  const total = STEM_POINTS[dayStem] + BRANCH_POINTS[dayBranch] + ELEMENT_POINTS[element];
  const stars = Math.min(5, Math.max(1, Math.round(total * 5 / 6)));
  const band = total >= 5 ? 'excellent' : total >= 3 ? 'good' : 'challenging';
  return {
    stars, total, band,
    aspects: {
      dayStem: { relation: dayStem },
      dayBranch: { relation: dayBranch },
      element: { relation: element },
    },
  };
}
```

- [ ] **Step 4: 成功を確認** — Run: `node --test tests/compatibility.test.mjs` / Expected: PASS（3テスト）。期待値はハンド検算済み。違う場合は実装を変えず実際の値を報告。

- [ ] **Step 5: コミット**

```bash
git add js/engine/compatibility.mjs tests/compatibility.test.mjs
git commit -m "feat: add compatibility engine (day-stem/branch relation + element complement)"
```

---

### Task 2: 相性コメント＋compatView

**Files:** Modify `js/data/interpretations.mjs`（追記）, Create `js/app/compatView.mjs`, Test `tests/compatView.test.mjs`.

- [ ] **Step 1: 失敗するテストを書く** — `tests/compatView.test.mjs`

```js
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
```

- [ ] **Step 2: 失敗を確認** — Run: `node --test tests/compatView.test.mjs` / Expected: FAIL（`buildCompatView` 未定義）

- [ ] **Step 3: データ追記** — `js/data/interpretations.mjs` の末尾に追記

```js
// 相性：総合コメント（バンド別）と3観点の関係ごとのラベル・一言
export const COMPAT = {
  band: {
    excellent: 'とても良い相性。自然に惹かれ合い、支え合える関係です。お互いの違いも魅力になります。',
    good: '良い相性。噛み合う部分が多く、歩み寄れば心地よい関係を築けます。',
    challenging: '刺激的な相性。違いが大きい分、学び合える関係。相手を尊重する意識が鍵です。',
  },
  dayStem: {
    '干合': { label: '惹かれ合う', note: '強く引き合う特別な縁' },
    '比和': { label: '似た者同士', note: '価値観が近く気楽' },
    '相生': { label: '支え合い', note: '自然に助け合える' },
    '相剋': { label: '刺激し合う', note: '違いが緊張にも成長にもなる' },
  },
  dayBranch: {
    '六合': { label: '調和', note: '生活リズムが噛み合う' },
    '中立': { label: 'ほどほど', note: '大きな衝突はなし' },
    '七冲': { label: 'ぶつかりやすい', note: '距離感の工夫を' },
  },
  element: {
    mutual: { label: '補い合う', note: '足りない気を互いに補える' },
    oneway: { label: '片方を補う', note: '一方が相手を支える形' },
    none: { label: '補完は弱め', note: '別の魅力で繋がる' },
  },
};
```

- [ ] **Step 4: 実装** — `js/app/compatView.mjs`

```js
import { COMPAT } from '../data/interpretations.mjs';

// compareCompatibility の結果に文言を当てて表示用に整える純関数
export function buildCompatView(result) {
  const { dayStem, dayBranch, element } = result.aspects;
  return {
    stars: result.stars,
    comment: COMPAT.band[result.band],
    aspects: [
      { title: '惹かれ合い', ...COMPAT.dayStem[dayStem.relation] },
      { title: '生活の噛み合い', ...COMPAT.dayBranch[dayBranch.relation] },
      { title: '補い合い', ...COMPAT.element[element.relation] },
    ],
  };
}
```

- [ ] **Step 5: 成功を確認** — Run: `node --test tests/compatView.test.mjs` / Expected: PASS（1テスト）。続けて `npm test` 全パス確認。

- [ ] **Step 6: コミット**

```bash
git add js/data/interpretations.mjs js/app/compatView.mjs tests/compatView.test.mjs
git commit -m "feat: add compatibility comments and view assembly"
```

---

### Task 3: UI統合（index.html＋main.mjs＋CSS＋sw.js）とブラウザ検証

**Files:** Modify `index.html`, Modify `js/app/main.mjs`, Modify `css/style.css`, Modify `sw.js`。

- [ ] **Step 1: index.html に相性UIを追加** — `#screen-result` 内、`<div class="actions">…</div>`（保存する/画像でシェア のボタン群）の直後に次を挿入

```html
      <button id="compat-btn" class="link">相性を見る</button>
      <form id="compat-form" class="card hidden">
        <p class="compat-q">相手の生年月日</p>
        <div class="row">
          <label>年<input type="number" id="cp-year" min="1900" max="2100" required /></label>
          <label>月<input type="number" id="cp-month" min="1" max="12" required /></label>
          <label>日<input type="number" id="cp-day" min="1" max="31" required /></label>
        </div>
        <div class="row">
          <label>時<input type="number" id="cp-hour" min="0" max="23" /></label>
          <label>分<input type="number" id="cp-minute" min="0" max="59" value="0" /></label>
        </div>
        <button type="submit" class="primary">相性を占う</button>
      </form>
      <div id="compat-root"></div>
```

- [ ] **Step 2: main.mjs に import と self保持を追加** — 既存 import 群の後に追加

```js
import { compareCompatibility } from '../engine/compatibility.mjs';
import { buildCompatView } from './compatView.mjs';
```

モジュール変数（`let currentLuck = null;` の近く）に追加：

```js
let currentMeishiki = null;
```

- [ ] **Step 3: self の meishiki を2つの描画箇所で保持** — `renderResult(currentVM)` を呼ぶ箇所で self meishiki を保存する。

(a) 送信ハンドラ内、`const meishiki = buildMeishiki(window.Solar, birth);` の後に追加：
```js
  currentMeishiki = meishiki;
```
(b) 保存一覧から開くハンドラ内、`const meishiki = buildMeishiki(window.Solar, rec.birth);` の後に追加：
```js
    currentMeishiki = meishiki;
```

- [ ] **Step 4: 相性のレンダラと相手入力読み取りを追加** — `main.mjs` の `renderResult` 関数の後に追加

```js
function readPartnerBirth() {
  const b = { year: +$('#cp-year').value, month: +$('#cp-month').value, day: +$('#cp-day').value };
  if ($('#cp-hour').value !== '') { b.hour = +$('#cp-hour').value; b.minute = +$('#cp-minute').value || 0; }
  return b;
}

function renderCompat(view) {
  const stars = '★'.repeat(view.stars) + '☆'.repeat(5 - view.stars);
  const rows = view.aspects.map(a =>
    `<div class="compat-aspect"><span class="t">${a.title}</span>`
    + `<span class="l">${a.label}</span><span class="n">${a.note}</span></div>`).join('');
  $('#compat-root').innerHTML = `<div class="card section compat-result">`
    + `<p class="compat-stars">${stars}</p>${rows}`
    + `<p class="compat-comment">${view.comment}</p></div>`;
}
```

- [ ] **Step 5: 相性のイベントハンドラを追加** — 既存の `$('#...').addEventListener(...)` 群の近くに追加

```js
$('#compat-btn').addEventListener('click', () => $('#compat-form').classList.toggle('hidden'));
$('#compat-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!currentMeishiki) return;
  const partner = buildMeishiki(window.Solar, readPartnerBirth());
  renderCompat(buildCompatView(compareCompatibility(currentMeishiki, partner)));
});
```

- [ ] **Step 6: CSS 追記** — `css/style.css` の末尾に追記

```css
.compat-q{color:var(--muted); font-size:13px; margin:0 0 6px;}
.compat-result{text-align:center;}
.compat-stars{font-size:26px; color:var(--gold); letter-spacing:4px; margin:2px 0 10px;}
.compat-aspect{display:grid; grid-template-columns:auto auto 1fr; gap:8px; text-align:left;
  align-items:baseline; padding:6px 0; border-top:1px solid var(--line); font-size:13px;}
.compat-aspect .t{color:var(--muted); font-size:12px;}
.compat-aspect .l{color:var(--gold); font-weight:600;}
.compat-aspect .n{color:var(--ink); font-size:12px;}
.compat-comment{margin-top:10px; font-size:13px; line-height:1.7; text-align:left;}
```

- [ ] **Step 7: sw.js 更新** — `ASSETS` 配列に2件追加（`'./js/engine/yojin.mjs'` の行の後など）

```js
  './js/engine/compatibility.mjs', './js/app/compatView.mjs',
```

キャッシュ名を更新：`const CACHE = 'shichu-suimei-v5';`

- [ ] **Step 8: 全テスト実行** — Run: `npm test` / Expected: 全テストPASS（既存61＋compatibility3＋compatView1＝65）。

- [ ] **Step 9: ブラウザ検証** — このプロジェクトのディレクトリで `python -m http.server 8210` をバックグラウンド起動。`http://localhost:8210/` を開く（プレビューMCPが別プロジェクトに固定される場合は自前サーバを使う）。1990/6/19・14:25 で「占う」→ 結果画面で「相性を見る」を押す。確認：
  - 相手入力ミニフォームが開く。年月日を入れて「相性を占う」を押すと、相性結果（★、3観点の惹かれ合い／生活の噛み合い／補い合い、総合コメント）が出る
  - もう一度「相性を見る」でフォームが閉じる
  - コンソールエラーなし
  - iPhone SE幅（375px）で `document.scrollWidth === clientWidth`（横スクロールなし）
  ヘッドレスブラウザが無ければ、`npm test` 全パス＋静的サーバが `js/engine/compatibility.mjs`・`js/app/compatView.mjs` を200で返すことを確認し、目視は pending と報告。

- [ ] **Step 10: コミット**

```bash
git add index.html js/app/main.mjs css/style.css sw.js
git commit -m "feat: add compatibility flow to result screen"
```

---

## Self-Review（記入済み）

- **Spec coverage:** 日干/日支/五行補完の判定＋スコア/バンド=Task1／総合コメント・3観点文言・compatView=Task2／導線（相性ボタン＋相手ミニフォーム）・描画・レスポンシブ・SW=Task3／テストは各Task＋Task3全体実行。
- **Placeholder scan:** TBD/TODOなし。COMPAT 全関係の文言を記載。全コードブロック明示。
- **Type consistency:** `dayStemRelation/dayBranchRelation`→string、`elementComplement`→`'mutual'|'oneway'|'none'`、`compareCompatibility`→`{stars,total,band,aspects:{dayStem:{relation},dayBranch:{relation},element:{relation}}}`、`buildCompatView`→`{stars,comment,aspects:[{title,label,note}]}`。main.mjs は `currentMeishiki`(self) と相手 meishiki を `compareCompatibility` に渡し、`buildCompatView` の `stars/comment/aspects[].title/label/note` を参照——一致。検証値：甲vs庚→相剋、卯vs申→中立、用神火↔相手火→oneway、total3/★3/good はハンド検算済み。
