# 格局・用神 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 命式の「格局（型）」を判定し、①の身強身弱を土台に「用神（良い五行）」とラッキーカラー・吉方位・相性を出して結果画面に表示する。

**Architecture:** 純ロジックの `kakkyoku.mjs`（月支本気の通変星で格を判定）と `yojin.mjs`（抑扶法で用神五行→色/方位/相性）を追加し、`interpret.mjs`→`viewModel.mjs`→`main.mjs` の既存パイプラインに組み込む。

**Tech Stack:** Vanilla ES modules, `node --test`。既存 `tenStar`/`judgeStrength`/`STEM_INFO`/`ELEMENTS`/`HIDDEN_STEMS` を再利用。

**Project dir:** `C:\Users\hiroy\Desktop\Claude code\shichu-suimei`（Windows, Bash tool）。全コミット末尾に `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。

**前提（既存コードの事実）:**
- `js/engine/tenStar.mjs` → `tenStar(dayStem, otherStem)` → 通変星名。
- `js/engine/shinStrength.mjs` → `judgeStrength(meishiki)` → `{ level: '身強'|'中庸'|'身弱', ... }`。
- `js/engine/tables.mjs` → `STEM_INFO`（`STEM_INFO['乙']={element:'wood',yin:true}`）、`ELEMENTS = ['wood','fire','earth','metal','water']`。
- `meishiki`：`{ dayMaster, pillars:{ year, month, day, hour?, ... } }`、各 pillar は `{ stem, branch, hiddenStems, tenStar, twelveStage }`、`hiddenStems[0]` が本気。
- `js/data/interpret.mjs` → `interpret(meishiki)` が `{ dayMaster, talents, dominantElement, strength, lackingElements }` を返す。
- `js/app/viewModel.mjs` → `buildViewModel(meishiki, birth)`、内部で `const r = interpret(meishiki)`。
- 五行サイクル：`ELEMENTS` で X が生む=`(X+1)%5`、X を生む=`(X+4)%5`。

---

### Task 1: 格局エンジン `kakkyoku.mjs`

**Files:** Create `js/engine/kakkyoku.mjs`, Test `tests/kakkyoku.test.mjs`.

- [ ] **Step 1: 失敗するテストを書く** — `tests/kakkyoku.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeKakkyoku } from '../js/engine/kakkyoku.mjs';

const mk = (dayMaster, monthHonki) => ({ dayMaster, pillars: { month: { hiddenStems: [monthHonki] } } });

test('月支本気が比肩なら建禄格', () => {
  // 日主 甲、月支本気 甲 → 比肩
  assert.deepEqual(judgeKakkyoku(mk('甲', '甲')), { name: '建禄格', star: '比肩' });
});

test('月支本気が劫財なら月刃格', () => {
  // 日主 甲、月支本気 乙 → 劫財
  assert.deepEqual(judgeKakkyoku(mk('甲', '乙')), { name: '月刃格', star: '劫財' });
});

test('それ以外は通変星＋格（食神→食神格）', () => {
  // 日主 乙、月支本気 丁 → 食神
  assert.deepEqual(judgeKakkyoku(mk('乙', '丁')), { name: '食神格', star: '食神' });
});

test('正官は正官格', () => {
  // 日主 庚、月支本気 丁 → 正官
  assert.deepEqual(judgeKakkyoku(mk('庚', '丁')), { name: '正官格', star: '正官' });
});
```

- [ ] **Step 2: 失敗を確認** — Run: `node --test tests/kakkyoku.test.mjs` / Expected: FAIL（`judgeKakkyoku` 未定義）

- [ ] **Step 3: 実装** — `js/engine/kakkyoku.mjs`

```js
import { tenStar } from './tenStar.mjs';

// 月支の本気蔵干の通変星で格局を判定する（簡易法）。
// 比肩→建禄格、劫財→月刃格、それ以外は通変星名＋「格」。
export function judgeKakkyoku(meishiki) {
  const honki = meishiki.pillars.month.hiddenStems[0];
  const star = tenStar(meishiki.dayMaster, honki);
  let name;
  if (star === '比肩') name = '建禄格';
  else if (star === '劫財') name = '月刃格';
  else name = star + '格';
  return { name, star };
}
```

- [ ] **Step 4: 成功を確認** — Run: `node --test tests/kakkyoku.test.mjs` / Expected: PASS（4テスト）

- [ ] **Step 5: コミット**

```bash
git add js/engine/kakkyoku.mjs tests/kakkyoku.test.mjs
git commit -m "feat: add kakkyoku (chart pattern) judgment engine"
```

---

### Task 2: 用神エンジン `yojin.mjs`

**Files:** Create `js/engine/yojin.mjs`, Test `tests/yojin.test.mjs`.

- [ ] **Step 1: 失敗するテストを書く** — `tests/yojin.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeYojin } from '../js/engine/yojin.mjs';

// judgeStrength は本気 hiddenStems を見るので各 pillar に持たせる
// 日主 庚 で身弱になるサンプル（午/午/申）
const weak = { dayMaster: '庚', pillars: {
  year:  { stem: '庚', branch: '午', hiddenStems: ['丁','己'] },
  month: { stem: '壬', branch: '午', hiddenStems: ['丁','己'] },
  day:   { stem: '庚', branch: '申', hiddenStems: ['庚','壬','戊'] },
  hasHourPillar: false,
}};
// 日主 甲 で身強になるサンプル
const strong = { dayMaster: '甲', pillars: {
  year:  { stem: '壬', branch: '子', hiddenStems: ['癸'] },
  month: { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
  day:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
  hour:  { stem: '癸', branch: '子', hiddenStems: ['癸'] },
  hasHourPillar: true,
}};
// 日主 甲 で中庸になるサンプル
const mid = { dayMaster: '甲', pillars: {
  year:  { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
  month: { stem: '丙', branch: '辰', hiddenStems: ['戊','乙','癸'] },
  day:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
  hour:  { stem: '庚', branch: '子', hiddenStems: ['癸'] },
  hasHourPillar: true,
}};

test('身弱は日主を生む五行が用神（庚→土）', () => {
  const y = judgeYojin(weak);
  assert.equal(y.level, '身弱');
  assert.equal(y.element, 'earth');
  assert.equal(y.elementName, '土');
  assert.equal(y.color, '黄・茶');
  assert.equal(y.direction, '中央');
});

test('身強は日主が生む五行が用神（甲→火）', () => {
  const y = judgeYojin(strong);
  assert.equal(y.level, '身強');
  assert.equal(y.element, 'fire');
  assert.equal(y.color, '赤');
  assert.equal(y.direction, '南');
});

test('中庸は日主と同じ五行が用神（甲→木）', () => {
  const y = judgeYojin(mid);
  assert.equal(y.level, '中庸');
  assert.equal(y.element, 'wood');
  assert.equal(y.direction, '東');
});

test('相性の一文が用神の和名を含む', () => {
  const y = judgeYojin(weak);
  assert.ok(y.affinity.includes('土'));
});
```

- [ ] **Step 2: 失敗を確認** — Run: `node --test tests/yojin.test.mjs` / Expected: FAIL（`judgeYojin` 未定義）

- [ ] **Step 3: 実装** — `js/engine/yojin.mjs`

```js
import { STEM_INFO, ELEMENTS } from './tables.mjs';
import { judgeStrength } from './shinStrength.mjs';

const ELEMENT_NAME = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
const COLOR = { wood: '青・緑', fire: '赤', earth: '黄・茶', metal: '白・銀', water: '青・黒' };
const DIRECTION = { wood: '東', fire: '南', earth: '中央', metal: '西', water: '北' };

// 抑扶法による用神。身弱→日主を生む五行、身強→日主が生む五行、中庸→日主と同じ五行。
export function judgeYojin(meishiki) {
  const level = judgeStrength(meishiki).level;
  const dayEl = STEM_INFO[meishiki.dayMaster].element;
  const i = ELEMENTS.indexOf(dayEl);
  let element;
  if (level === '身弱') element = ELEMENTS[(i + 4) % 5];      // 日主を生む（印）
  else if (level === '身強') element = ELEMENTS[(i + 1) % 5]; // 日主が生む（食傷）
  else element = dayEl;                                       // 中庸
  return {
    level,
    element,
    elementName: ELEMENT_NAME[element],
    color: COLOR[element],
    direction: DIRECTION[element],
    affinity: `${ELEMENT_NAME[element]}の気が強い人と好相性`,
  };
}
```

- [ ] **Step 4: 成功を確認** — Run: `node --test tests/yojin.test.mjs` / Expected: PASS（4テスト）

- [ ] **Step 5: コミット**

```bash
git add js/engine/yojin.mjs tests/yojin.test.mjs
git commit -m "feat: add yojin (useful-god) engine with color/direction/affinity"
```

---

### Task 3: 診断文＋interpret／viewModel 組み込み

**Files:** Modify `js/data/interpretations.mjs`（追記）, Modify `js/data/interpret.mjs`, Modify `js/app/viewModel.mjs`, Test: 更新 `tests/interpret.test.mjs` と `tests/viewModel.test.mjs`。

- [ ] **Step 1: interpret テストに追記** — `tests/interpret.test.mjs` の末尾（最後の `test(...)` の後、ファイル末尾）に2テスト追加

```js
test('格局が判定される', () => {
  const r = interpret(sampleMeishiki);
  assert.equal(r.kakkyoku.name, '正官格'); // 庚・月支午本気丁→正官
  assert.ok(r.kakkyoku.text.length > 0);
});

test('用神と活用文が出る', () => {
  const r = interpret(sampleMeishiki);
  assert.equal(r.yojin.element, 'earth'); // 庚・身弱→土
  assert.ok(r.yojin.color.length > 0);
  assert.ok(r.yojin.use.length > 0);
});
```

- [ ] **Step 2: 失敗を確認** — Run: `node --test tests/interpret.test.mjs` / Expected: FAIL（`r.kakkyoku` undefined）

- [ ] **Step 3: データ追記** — `js/data/interpretations.mjs` の末尾に追記

```js
// 格局10種の性格・生き方
export const KAKKYOKU = {
  '建禄格': '自立心が強く、自分の実力で道を切り開く独立独歩の人。組織より一国一城が向きます。',
  '月刃格': '強い意志とパワーを持つ行動派。勢いが武器。強引さを抑えるとさらに伸びます。',
  '正官格': '規律と責任感のある正統派。公正さで信頼を集め、組織や公の場で力を発揮します。',
  '偏官格': '度胸と決断力のある武人タイプ。困難に立ち向かう強さがあり、勝負どころに強い。',
  '正財格': '堅実で誠実な現実派。コツコツ築く力に長け、信用と蓄えで安定を得ます。',
  '偏財格': '社交的で商才に富む人。お金と人をよく動かし、機転とフットワークが魅力。',
  '食神格': 'おおらかで表現豊かな人。衣食住に恵まれ、楽しみを生み出す才能を持ちます。',
  '傷官格': '感性鋭く才気あふれる人。専門性や美的センスが光る。言葉と感情の扱いが鍵。',
  '印綬格': '知性と思いやりのある学究肌。学び・教え・支える役割で力を発揮します。',
  '偏印格': '独創的で探究心の強い人。ひらめきと専門知識が武器。自由な発想を活かして。',
};

// 用神の活かし方（身強/身弱/中庸）
export const YOJIN_USE = {
  '身強': 'あなたは力が強いタイプ。用神の五行で「発散・調整」すると運が整います。色や方位を取り入れ、エネルギーを外へ。',
  '身弱': 'あなたは支えがほしいタイプ。用神の五行で「補強」すると安定します。色や方位を味方につけ、無理せず力を蓄えて。',
  '中庸': 'バランス型のあなたは自分の軸が用神。日主の五行を大切にしつつ、状況に応じて柔軟に動きましょう。',
};
```

- [ ] **Step 4: interpret に組み込む** — `js/data/interpret.mjs` を編集。(a) import 行を差し替え、(b) return に2フィールド追加。

(a) 先頭の import 群を次に差し替え：
```js
import { judgeStrength } from '../engine/shinStrength.mjs';
import { judgeKakkyoku } from '../engine/kakkyoku.mjs';
import { judgeYojin } from '../engine/yojin.mjs';
import { DAY_MASTER, TEN_STAR, ELEMENT_TENDENCY, STRENGTH, ELEMENT_LACK, KAKKYOKU, YOJIN_USE } from './interpretations.mjs';
```

(b) `return { ... }` に、`lackingElements,` の行の直後（閉じ `}` の前）へ次を追加：
```js
    kakkyoku: (() => { const k = judgeKakkyoku(meishiki); return { ...k, text: KAKKYOKU[k.name] }; })(),
    yojin: (() => { const y = judgeYojin(meishiki); return { ...y, use: YOJIN_USE[y.level] }; })(),
```

- [ ] **Step 5: viewModel テストに追記** — `tests/viewModel.test.mjs` の末尾に1テスト追加

```js
test('格局・用神が露出される', () => {
  const vm = buildViewModel(meishiki, { year: 1990, month: 6, day: 19 });
  assert.ok(vm.kakkyoku.name.length > 0);
  assert.ok(vm.yojin.element.length > 0);
  assert.ok(vm.yojin.color.length > 0);
});
```

- [ ] **Step 6: viewModel に露出を追加** — `js/app/viewModel.mjs` の `return { ... }` 内、`lacking: r.lackingElements,` の直後に追加：
```js
    kakkyoku: r.kakkyoku,
    yojin: r.yojin,
```

- [ ] **Step 7: テスト実行** — Run: `node --test tests/interpret.test.mjs tests/viewModel.test.mjs` / Expected: PASS。続けて `npm test` で全体パスを確認。
（注：`node --test` に複数ファイルを渡すこと。ディレクトリ引数は環境により誤作動するため使わない。）

- [ ] **Step 8: コミット**

```bash
git add js/data/interpretations.mjs js/data/interpret.mjs js/app/viewModel.mjs tests/interpret.test.mjs tests/viewModel.test.mjs
git commit -m "feat: wire kakkyoku/yojin into interpretation and view model"
```

---

### Task 4: UI統合（main.mjs＋CSS＋sw.js）とブラウザ検証

**Files:** Modify `js/app/main.mjs`, Modify `css/style.css`, Modify `sw.js`。

- [ ] **Step 1: renderResult に格局・用神セクションを挿入** — `js/app/main.mjs` の `renderResult` 内、`gogyou-section` の `</div>` の直後・`${renderLuckSection(currentLuck)}` の行の直前に次を挿入

```js
    <div class="card section kakkyoku-section element-${vm.yojin.element}">
      <h3>格局・用神</h3>
      <p class="kakkyoku-name">${vm.kakkyoku.name}</p>
      <p>${vm.kakkyoku.text}</p>
      <div class="yojin-grid">
        <div><span class="lbl">用神</span><span class="val">${vm.yojin.elementName}</span></div>
        <div><span class="lbl">ラッキーカラー</span><span class="val">${vm.yojin.color}</span></div>
        <div><span class="lbl">吉方位</span><span class="val">${vm.yojin.direction}</span></div>
        <div><span class="lbl">相性</span><span class="val">${vm.yojin.affinity}</span></div>
      </div>
      <p class="yojin-use">${vm.yojin.use}</p>
    </div>
```

- [ ] **Step 2: CSS 追記** — `css/style.css` の末尾に追記

```css
.kakkyoku-section .kakkyoku-name{font-size:20px; font-weight:600; color:var(--gold); margin:2px 0 8px;}
.yojin-grid{display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:12px 0;}
.yojin-grid > div{background:rgba(157,178,230,.1); border-radius:8px; padding:8px 10px;}
.yojin-grid .lbl{display:block; font-size:11px; color:var(--muted); margin-bottom:2px;}
.yojin-grid .val{font-size:14px; font-weight:600; color:var(--ink);}
.yojin-use{font-size:13px; line-height:1.7;}
```

- [ ] **Step 3: sw.js 更新** — `ASSETS` 配列に2件追加（`'./js/app/luckView.mjs'` の行の後など）

```js
  './js/engine/kakkyoku.mjs', './js/engine/yojin.mjs',
```

キャッシュ名を更新：`const CACHE = 'shichu-suimei-v4';`

- [ ] **Step 4: 全テスト実行** — Run: `npm test` / Expected: 全テストPASS（既存50＋kakkyoku4＋yojin4＋interpret2＋viewModel1＝61）。

- [ ] **Step 5: ブラウザ検証** — このプロジェクトのディレクトリで `python -m http.server 8210` をバックグラウンド起動。`http://localhost:8210/` を開く（プレビューMCPが別プロジェクトに固定される場合は自前サーバを使う）。性別任意・1990/6/19・14:25 で「占う」。確認：
  - 「格局・用神」セクションが出る。格局名（例 食神格）＋特徴文が表示される
  - 用神・ラッキーカラー・吉方位・相性の4項目が出る
  - 用神の活かし方の文が出る
  - コンソールエラーなし
  - iPhone SE幅（375px）で `document.scrollWidth === clientWidth`（横スクロールなし）
  ヘッドレスブラウザが無ければ、`npm test` 全パス＋静的サーバが `js/engine/kakkyoku.mjs`・`js/engine/yojin.mjs` を200で返すことを確認し、目視は pending と報告。

- [ ] **Step 6: コミット**

```bash
git add js/app/main.mjs css/style.css sw.js
git commit -m "feat: render kakkyoku/yojin section on result screen"
```

---

## Self-Review（記入済み）

- **Spec coverage:** 格局判定=Task1／用神判定＋色方位相性=Task2／格局・用神の解釈文＋interpret/viewModel組み込み=Task3／UI統合・レスポンシブ・SW=Task4／テストは各Task＋Task4全体実行。
- **Placeholder scan:** TBD/TODOなし。KAKKYOKU10種・YOJIN_USE3種すべて記載。全コードブロック明示。
- **Type consistency:** `judgeKakkyoku(meishiki)`→`{name,star}`／`judgeYojin(meishiki)`→`{level,element,elementName,color,direction,affinity}`。interpret は `kakkyoku:{...,text}`・`yojin:{...,use}` を返し、viewModel が `vm.kakkyoku`/`vm.yojin` で露出、main.mjs は `vm.kakkyoku.name/text`・`vm.yojin.element/elementName/color/direction/affinity/use` を参照——一致。検証値：日主乙・月支午本気丁→食神格、日主庚→正官格・身弱→用神earth、はハンドverified。
