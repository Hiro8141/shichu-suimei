# 機能③ 格局・用神 設計書

- 作成日: 2026-06-19
- ステータス: 設計確定（実装計画待ち）
- 対象プロジェクト: shichu-suimei（四柱推命PWA）
- 位置づけ: 「もっと細かい分析」ロードマップ第3弾（①身強身弱＋五行可視化、②大運・年運は完了・公開済み）

## 0. 背景

「格局」は命式の型を見極めるもの、「用神」はその人にとって良い五行。①の身強身弱判定（`judgeStrength`）と既存 `tenStar`・蔵干（`HIDDEN_STEMS`）を土台に実装する。性別非依存（誰でも表示）。後続は④相性診断。

## 1. スコープ

含む：格局の判定（月支本気＋建禄/月刃）、用神の判定（抑扶法）、用神からのラッキーカラー・吉方位・相性、格局/用神の解釈文、結果画面への統合。
含まない：透干を見る格局の本格判定（簡易版を採用）、調候用神・病薬用神などの高度な用神論、相性診断（機能④）。

## 2. 格局エンジン `js/engine/kakkyoku.mjs`

純ロジック。`judgeKakkyoku(meishiki)` を提供。

- 月支 = `meishiki.pillars.month.branch`、その本気蔵干 = `month.hiddenStems[0]`。
- `star = tenStar(meishiki.dayMaster, 本気蔵干)`。
- 格の決定：
  - `star === '比肩'` → `name = '建禄格'`
  - `star === '劫財'` → `name = '月刃格'`
  - それ以外 → `name = star + '格'`（正官格・偏官格・正財格・偏財格・食神格・傷官格・印綬格・偏印格）
- 出力：`{ name, star }`（例 `{ name: '食神格', star: '食神' }`）
- 既知の検証値：1990-06-19（日干 乙）の月支は 午（本気 丁）。`tenStar(乙, 丁) = 食神` → `食神格`。

## 3. 用神エンジン `js/engine/yojin.mjs`

純ロジック。`judgeYojin(meishiki)` を提供。①の `judgeStrength` を内部で呼ぶ。

### 3.1 五行サイクル（既存 `ELEMENTS = [wood, fire, earth, metal, water]`）
- X が生む五行 = `(X+1)%5`、X を生む五行 = `(X-1+5)%5`。

### 3.2 抑扶法による用神五行
- `level = judgeStrength(meishiki).level`、`dayElement = STEM_INFO[dayMaster].element`。
- **身弱** → 用神 = 日主を生む五行（印で補強）＝ `(dayIdx-1+5)%5`
- **身強** → 用神 = 日主が生む五行（食傷で漏らす）＝ `(dayIdx+1)%5`
- **中庸** → 用神 = 日主と同じ五行（自分の軸を活かす）＝ `dayElement`

### 3.3 用神五行からの実用情報（対応表）
- ラッキーカラー：木=青・緑／火=赤／土=黄・茶／金=白・銀／水=青・黒
- 吉方位：木=東／火=南／土=中央／金=西／水=北
- 相性：用神と同じ五行を多く持つ人（例 用神=水 →「水の気が強い人と好相性」）
- 五行の和名：wood=木／fire=火／earth=土／metal=金／water=水

### 3.4 出力
`{ level, element, elementName, color, direction, affinity }`
- `element`：用神の五行キー、`elementName`：和名、`color`/`direction`：上表、`affinity`：相性の一文。
- 既知の検証値：日主 乙（wood）で身弱なら用神は water（青・黒／北）。日主 庚（metal）で身弱なら用神は earth（黄・茶／中央）。

## 4. 診断文 `js/data/interpretations.mjs` 追記

- `KAKKYOKU`：格局10種（建禄格・月刃格・正官格・偏官格・正財格・偏財格・食神格・傷官格・印綬格・偏印格）ごとの性格・生き方の特徴文（本プロジェクトで執筆）。
- `YOJIN_USE`：身強／身弱／中庸ごとの「用神の活かし方」一文（本プロジェクトで執筆）。

## 5. 組み込み `interpret.mjs` → `viewModel.mjs` → `main.mjs`

- `interpret.mjs`：`judgeKakkyoku`/`judgeYojin` を呼び、戻り値に追加
  - `kakkyoku: { name, star, text: KAKKYOKU[name] }`
  - `yojin: { ...judgeYojin(meishiki), use: YOJIN_USE[level] }`
- `viewModel.mjs`：`r.kakkyoku` と `r.yojin` を露出。
- `main.mjs` の `renderResult`：**「格局・用神」セクション**を追加
  - 格局名＋特徴文
  - 用神の五行・ラッキーカラー（色チップ）・吉方位・相性・活かし方
- iPhone SE（375px）で崩れないこと。

## 6. テスト

- `kakkyoku`：月支本気が比肩→建禄格、劫財→月刃格、それ以外→通変星格（例 食神→食神格）を既知/合成サンプルで検証。
- `yojin`：身弱→印の五行、身強→食傷の五行、中庸→日主の五行。各々の color/direction/elementName が対応表どおり。
- `interpret`/`viewModel`：kakkyoku・yojin が組み立ち、文章が付くこと。
- 既存50テストが引き続き全て通ること。

## 7. スコープ外（将来）

- 透干を見る本格的な格局判定、変格（従旺・従児など）。
- 調候・病薬用神。
- 相性診断（機能④）。
