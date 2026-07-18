import { useMemo, useState } from 'react';
import {
  generateEggOptions,
  generateGenome,
  initialStatBonus,
  MOTIF_LABELS,
  paletteFromGenome,
  type Genome,
  type QuizAnswers,
} from './genome';
import { EggSprite } from './EggSprite';
import { encodeEggCode } from './eggCode';
import './App.css';

const STAT_LABELS: Record<string, string> = {
  wisdom: '知恵',
  technique: '技巧',
  resilience: '耐性',
  insight: 'ひらめき',
  discipline: '規律',
  vitality: '活力',
};

type QuizKey = keyof QuizAnswers;

const QUESTIONS: Array<{ key: QuizKey; text: string; options: Array<{ value: string; label: string }> }> = [
  {
    key: 'colorTone',
    text: 'ひかれる色合いは?',
    options: [
      { value: 'warm', label: 'あたたかい色(赤・ピンク・オレンジ)' },
      { value: 'cool', label: 'すずしい色(青・緑・紫)' },
      { value: 'pastel', label: 'やわらかいパステル' },
      { value: 'vivid', label: 'はっきりビビッド' },
    ],
  },
  {
    key: 'form',
    text: '好きなかたちは?',
    options: [
      { value: 'round', label: 'まるっと、ふんわり' },
      { value: 'sharp', label: 'しゅっと、シャープ' },
    ],
  },
  {
    key: 'workStyle',
    text: 'あなたの働き方は?',
    options: [
      { value: 'steady', label: 'コツコツ毎日すこしずつ' },
      { value: 'burst', label: '集中モードで一気に' },
    ],
  },
  {
    key: 'aiUse',
    text: 'AIを一番よく使うのは?(これから、でもOK)',
    options: [
      { value: 'code', label: 'コードを書く・直す' },
      { value: 'writing', label: '文章を書く・整える' },
      { value: 'learning', label: '調べる・学ぶ' },
      { value: 'starter', label: 'まだあまり使っていない(これから!)' },
    ],
  },
  {
    key: 'creature',
    text: '心ひかれる生き物は?',
    options: [
      { value: 'bird', label: '空をとぶ鳥' },
      { value: 'beast', label: 'もふもふのけもの' },
      { value: 'aquatic', label: '水にすむ生き物' },
      { value: 'mythic', label: '伝説の幻獣' },
    ],
  },
];

function typeLabelOf(answers: QuizAnswers): string {
  const bonus = initialStatBonus(answers);
  return `${STAT_LABELS[bonus.stat]}タイプ・${MOTIF_LABELS[answers.creature]}`;
}

async function downloadEggPng(genome: Genome) {
  const cell = 24;
  const svgEl = document.querySelector('.result-egg svg');
  if (!svgEl) return;
  const xml = new XMLSerializer().serializeToString(svgEl);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  await new Promise((resolve) => (img.onload = resolve));
  const canvas = document.createElement('canvas');
  canvas.width = 9 * cell + 160;
  canvas.height = 11 * cell + 200;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#2c245a');
  grad.addColorStop(1, '#131028');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 80, 70, 9 * cell, 11 * cell);
  ctx.fillStyle = '#B09BDD';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AI MONSTER', canvas.width / 2, canvas.height - 30);
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `ai-monster-egg-${genome.seed}.png`;
  link.click();
}

export default function App() {
  const [step, setStep] = useState<'landing' | 'quiz' | 'eggs' | 'result'>('landing');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [chosen, setChosen] = useState<Genome | null>(null);
  const [copied, setCopied] = useState(false);
  const baseSeed = useMemo(() => (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0, []);

  const demoEggs = useMemo(() => {
    const demo: QuizAnswers = {
      colorTone: 'pastel',
      form: 'round',
      workStyle: 'steady',
      aiUse: 'code',
      creature: 'bird',
    };
    return [
      generateGenome(demo, 111),
      generateGenome({ ...demo, colorTone: 'warm' }, 222),
      generateGenome({ ...demo, colorTone: 'cool' }, 333),
    ];
  }, []);

  const eggs = useMemo(
    () =>
      step === 'eggs' || step === 'result'
        ? generateEggOptions(answers as QuizAnswers, baseSeed)
        : [],
    [step, answers, baseSeed],
  );

  const restart = () => {
    setStep('landing');
    setQIndex(0);
    setAnswers({});
    setChosen(null);
    setCopied(false);
  };

  if (step === 'landing') {
    return (
      <main className="page landing-page">
        <div className="demo-eggs">
          {demoEggs.map((g) => (
            <EggSprite key={g.seed} genome={g} cell={7} />
          ))}
        </div>
        <h1>
          あなたのAI活用タイプから
          <br />
          世界に一つの卵が生まれる
        </h1>
        <p className="sub">
          5つの質問に答えると、色も柄も二度と同じものが出ない「あなただけの卵」が生まれます。AIを使うほど育つデスクトップの相棒(macOS版・近日公開)の、はじまりの卵です。
        </p>
        <button className="primary big" onClick={() => setStep('quiz')}>
          診断をはじめる(30秒)
        </button>
      </main>
    );
  }

  if (step === 'quiz') {
    const q = QUESTIONS[qIndex];
    const back = () => {
      if (qIndex === 0) setStep('landing');
      else setQIndex(qIndex - 1);
    };
    return (
      <main className="page quiz-page">
        <p className="progress">
          {qIndex + 1} / {QUESTIONS.length}
        </p>
        <h1>{q.text}</h1>
        <div className="options">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              className="option"
              onClick={() => {
                setAnswers((prev) => ({ ...prev, [q.key]: opt.value }));
                if (qIndex + 1 >= QUESTIONS.length) setStep('eggs');
                else setQIndex(qIndex + 1);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button className="ghost back" onClick={back}>
          ← 戻る
        </button>
      </main>
    );
  }

  if (step === 'eggs') {
    return (
      <main className="page eggs-page">
        <h1>3つの卵が生まれた</h1>
        <p className="sub">柄も色も世界にひとつ。選ばなかった卵は消えます</p>
        <div className="egg-row">
          {eggs.map((egg) => (
            <button
              key={egg.seed}
              className="egg-btn"
              onClick={() => {
                setChosen(egg);
                setStep('result');
              }}
            >
              <EggSprite genome={egg} cell={11} />
            </button>
          ))}
        </div>
        <button
          className="ghost back"
          onClick={() => {
            setQIndex(QUESTIONS.length - 1);
            setStep('quiz');
          }}
        >
          ← 戻る
        </button>
      </main>
    );
  }

  const typeLabel = typeLabelOf(answers as QuizAnswers);
  const shareText = `私のAI活用タイプは【${typeLabel}】。世界に一つの卵が生まれた🥚 macOS版アプリの公開告知は @icryodev から #AIMonster`;
  const shareUrl = 'https://icryodev.github.io/ai-monster-egg/';
  const eggCode = chosen ? encodeEggCode(answers as QuizAnswers, chosen.seed) : '';
  const glowColor = chosen ? paletteFromGenome(chosen).inner : 'transparent';

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(eggCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // クリップボード不可の環境でもコードは画面に表示されている
    }
  };

  return (
    <main className="page result-page">
      <p className="sub">あなたは</p>
      <h1>{typeLabel}</h1>
      {/* 胎動: 数秒に一度、底を支点に左右へがたっと揺れ、直後に殻ごしに内側の色が透ける。
          輪郭は見せない(姿はアプリで孵るまでのお楽しみ — 形を約束しない) */}
      <div className="result-egg egg-alive">
        {chosen && (
          <>
            <span className="egg-glow" style={{ background: glowColor }} aria-hidden="true" />
            <EggSprite genome={chosen} cell={16} />
          </>
        )}
      </div>
      <p className="stir-note">……いま、中で動いた</p>
      <p className="sub">
        この柄は、あなたの回答から生まれた世界に一つの模様です。
        <br />
        何が生まれるかは、孵化させるまでわかりません
      </p>
      <div className="result-actions">
        <a className="primary big" href="https://github.com/icryodev/ai-monster-egg" target="_blank" rel="noreferrer">
          孵化のようすを見る — macOS版(まもなく)
        </a>
      </div>
      <div className="code-box">
        <p className="code-label">公開までの引換券 — 引きつぎコード</p>
        <p className="code-value">{eggCode}</p>
        <button className="option code-copy" onClick={() => void copyCode()}>
          {copied ? 'コピーしました ✓' : 'コードをコピー'}
        </button>
        <p className="code-note">macOS版が公開されたら、このコードでこの卵をそのまま育てられます</p>
      </div>
      <div className="result-actions">
        <a
          className="option"
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noreferrer"
        >
          Xでシェア(公開の知らせは @icryodev から)
        </a>
        <button className="option" onClick={() => chosen && void downloadEggPng(chosen)}>
          卵の画像を保存
        </button>
        <button className="ghost" onClick={restart}>
          もう一度診断する
        </button>
      </div>
    </main>
  );
}
