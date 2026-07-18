# 卵診断ページ デザイン刷新 — sol検分(2026-07-18)

- 発端: 友人指摘「背景・フォント・ボタンがAIっぽい」
- 検分: sol(gpt-5.6-sol)・read-only codex exec。以下は回答原文
- 社長判断: 刷新GO(2026-07-18)。実施は次セッション
- 統合注意: 結果画面の胎動アニメ(egg-wobble/innerglow、滑らかなease)は、処方箋5のsteps()文法を採用する場合に一緒に揃え直す
- Figma MCP接続済み: before/afterをFigmaキャンバスへ書き出して見比べる段取りが可能

---

## 結論

「AIっぽさ」の主因は、卵のドット絵ではなく、その周囲が「紫のグラデーション背景＋中央寄せ1カラム＋半透明カード＋黄色の角丸CTA」という生成AI/SaaS系ランディングページの定番構成になっていることです。

卵自体は `crispEdges` とピクセル描画が効いており、固有の世界観があります。UI側を「きれいなWebアプリ」から「夜の孵化室／ゲームの選択画面」へ寄せるのが最も効果的です。

## 診断：AIっぽく見える原因

### 1. 紫グラデーションが「AIサービス」の既視感を強くしている

[App.css:11](/Users/ishiiryo/work/ai-monster-egg/src/App.css:11) の背景は、明るい紫 `#2c245a` から暗い紫 `#100d22` への滑らかなグラデーションです。さらに文字色や補助色も、

- 本文 `#efe6ff`
- 補助文字 `#b09bdd`
- 半透明の白
- CTAの発光する黄色 `#ffd666`

に統一されています。

この「濃紺・紫＋発光アクセント」はAIプロダクト、Web3、占いアプリで非常によく使われる配色です。特に [App.css:14](/Users/ishiiryo/work/ai-monster-egg/src/App.css:14) の複数radial-gradientと [App.css:74](/Users/ishiiryo/work/ai-monster-egg/src/App.css:74) のぼかした黄色い影が、「AIが考えた幻想的な夜空」に見えやすい部分です。

星らしき点も数個の滑らかなgradientなので、ドット絵の卵と視覚言語が揃っていません。

### 2. フォントにブランド上の人格がない

[App.css:6](/Users/ishiiryo/work/ai-monster-egg/src/App.css:6) は、

```css
"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif
```

のみです。[index.html:3](/Users/ishiiryo/work/ai-monster-egg/index.html:3) にWebフォントの読み込みもありません。

そのため実際には端末標準の日本語ゴシックで表示され、「Reactで最低限整えた画面」に見えます。見出しも [App.css:35](/Users/ishiiryo/work/ai-monster-egg/src/App.css:35) の24px・700という一般的な指定だけで、本文との表情の差が弱いです。

卵は強いピクセル表現なのに、タイポグラフィからはゲーム、生命、相棒といった世界観が伝わりません。

### 3. ボタンが現代的なUIテンプレそのもの

主CTAは [App.css:62](/Users/ishiiryo/work/ai-monster-egg/src/App.css:62) の、

- 黄色の単色塗り
- `border-radius: 12px`
- 太字
- 大きめのpadding
- ぼかした同系色の影

という定番構成です。

選択肢も [App.css:89](/Users/ishiiryo/work/ai-monster-egg/src/App.css:89) の半透明白背景、薄い白枠、12px角丸、hoverで1px浮くカード型。卵の選択枠も [App.css:128](/Users/ishiiryo/work/ai-monster-egg/src/App.css:128) で同じ設計を18px角丸にしただけです。

特に「半透明カードが少し浮く」という挙動は、ゲーム画面よりSaaSのダッシュボードやAIチャットの候補ボタンを連想させます。

### 4. 全画面が同じ中央寄せテンプレになっている

[App.css:22](/Users/ishiiryo/work/ai-monster-egg/src/App.css:22) で、すべてのステップが、

- 最大幅460px
- 縦横中央寄せ
- `gap: 20px`
- 全文中央揃え

になっています。

ランディング、質問、卵選択、結果のすべてが同じシルエットなので、物語上の進行が画面構成に現れません。[App.tsx:147](/Users/ishiiryo/work/ai-monster-egg/src/App.tsx:147)、[App.tsx:170](/Users/ishiiryo/work/ai-monster-egg/src/App.tsx:170)、[App.tsx:197](/Users/ishiiryo/work/ai-monster-egg/src/App.tsx:197)、[App.tsx:235](/Users/ishiiryo/work/ai-monster-egg/src/App.tsx:235) の各画面が、どれも「見出し＋説明＋中央の要素＋ボタン」の繰り返しです。

質問の選択肢も均等な全幅カードが縦に並ぶため、診断テンプレ感が強くなっています。

### 5. 卵だけがピクセル世界に属し、周囲が別の製品に見える

[EggSprite.tsx:67](/Users/ishiiryo/work/ai-monster-egg/src/EggSprite.tsx:67) の `shapeRendering="crispEdges"` と [App.css:156](/Users/ishiiryo/work/ai-monster-egg/src/App.css:156) の `image-rendering: pixelated` は、このページで最も個性的な部分です。

一方、周囲は12〜18pxの滑らかな角丸、ぼかし影、easeアニメーションです。つまり「レトロな生命体」と「現代的なAIフォーム」の二つのデザイン言語が同居しています。結果画面の滑らかな浮遊アニメーション [App.css:141](/Users/ishiiryo/work/ai-monster-egg/src/App.css:141) も、ピクセル世界なら段階的な上下移動のほうが自然です。

## 処方箋：優先度順

### 1. 紫グラデーションをやめ、「静かな夜＋古い端末」の固有配色にする

まずここが最大効果です。背景をほぼ単色の夜色に変えます。

推奨パレット：

- 最背面：`#080D1B`
- 面・パネル：`#111A2E`
- 明るい面：`#19243D`
- 主文字：`#F2E7C4`
- 補助文字：`#9AA6B8`
- 主アクセント：`#E3B455`
- 生命感の副アクセント：`#74BFA3`
- 最暗部・影：`#03060D`

全面グラデーションは外し、星はCSSの小さな点を規則的に配置します。たとえば `background-size: 48px 48px, 80px 80px` を持つradial-gradientにすると、ぼんやりした宇宙背景ではなく、ゲーム画面の星図らしい質感になります。

紫は完全禁止にせず、卵の個体色として残すのがよいです。背景から紫を引くことで、各卵の色が初めて主役になります。

### 2. 見出しだけピクセル系日本語フォントにする

無料かつ日本語対応で扱いやすい組み合わせは以下です。

- 見出し・進捗・コード：`DotGothic16`
- 本文・選択肢：`Zen Kaku Gothic New`

見出しまで全て丸ゴシックにすると子供向けへ寄りすぎます。`DotGothic16` はタイトルや短い問いだけに限定し、本文は読みやすいゴシックを使うのが安全です。

```css
:root {
  font-family: "Zen Kaku Gothic New", sans-serif;
}

h1,
.progress,
.code-value {
  font-family: "DotGothic16", monospace;
  font-weight: 400;
}
```

見出しは24pxの太字より、26〜30px、字間 `0.06em`、通常ウェイトのほうが「ゲーム内の語り」に見えます。

### 3. ボタンを「角丸CTA」から「選択コマンド」に変える

12〜18pxの角丸とぼかし影をやめ、次の方針に統一します。

```css
border: 2px solid #56627A;
border-radius: 3px;
background: #111A2E;
box-shadow:
  inset 0 0 0 2px #19243D,
  4px 4px 0 #03060D;
transition: none;
```

主ボタンは黄色で面全体を塗らず、濃色の面＋黄土色の枠・文字にします。hover時は枠を `#E3B455`、背景を `#19243D` に変更。active時は `translate(3px, 3px)` して硬い影を縮めます。

選択肢は中央揃えから左揃えにし、`::before` で `01 / 02 / 03` や小さな菱形カーソルを付けると、「汎用診断フォーム」から「相棒を呼び出す選択画面」へ変わります。

卵のボタンも半透明カードではなく、暗い台座か細い選択フレームだけにします。卵そのものの輪郭を主役にするため、通常時は背景をほぼ透明にして構いません。

### 4. 余白を8px単位に揃え、画面ごとに重心を変える

現在の一律 `gap: 20px` をやめ、8pxグリッドへ寄せます。

- タイトルと説明：8〜12px
- 説明と主役の卵：24〜32px
- 卵と決定操作：24px
- セクション間：40〜48px

質問画面は中央揃えをやめ、見出しと選択肢を左揃えにします。卵選択画面だけは中央揃え、結果画面は卵を大きく見せる、と画面ごとに重心を変えるべきです。

構造変更を抑えるなら、`.page` は共通の外枠に留め、`.options` と質問時の見出しだけ左揃えにするだけでも大きく改善します。

### 5. アニメーションもピクセル表現へ合わせる

[App.css:146](/Users/ishiiryo/work/ai-monster-egg/src/App.css:146) の滑らかな3秒浮遊を、段階的な動きに変更します。

```css
animation: bob 1.2s steps(2, jump-none) infinite;
```

hoverも `translateY(-1px)` の繊細な浮遊ではなく、色の即時切り替えか2〜4px単位の移動にします。これで卵、フォント、ボタン、モーションが同じ世界のものになります。

`prefers-reduced-motion` ではアニメーションを無効化してください。

## やらなくていいこと

- 星、惑星、孵化室などの背景画像を大量に制作する必要はありません。単色背景、CSSの点、枠線だけで十分です。
- ドット絵UIキットや複雑なピクセル枠を新規実装する必要もありません。2px枠、硬い影、3px程度の角丸で世界観は成立します。
- すべての文字をピクセルフォントにしないでください。長文の可読性が落ち、安価なレトロゲーム風になります。
- 卵に発光、粒子、オーラを大量追加しないでください。柄の固有性が埋もれます。
- 画面ごとに別デザインを作り込む必要はありません。「夜色」「2種類のフォント」「硬い選択枠」「8pxグリッド」の4ルールを共有するだけで、個人開発でも維持できます。
