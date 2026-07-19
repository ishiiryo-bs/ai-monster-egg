import type { StatKey } from './coreTypes';

export interface QuizAnswers {
  colorTone: 'warm' | 'cool' | 'pastel' | 'vivid' | 'dusty';
  form: 'round' | 'sharp';
  workStyle: 'steady' | 'burst';
  aiUse: 'code' | 'writing' | 'learning' | 'starter';
  creature: 'bird' | 'beast' | 'aquatic' | 'mythic';
}

export type EggPattern = 'spots' | 'stripes' | 'swirl' | 'stars';
export type Personality = 'nonbiri' | 'kibikibi';

export interface Genome {
  version: 1;
  seed: number;
  hueBase: number;
  hueInner: number;
  sat: number;
  lightness: number;
  pattern: EggPattern;
  patternDensity: 1 | 2 | 3;
  earStyle: number;
  tailStyle: number;
  eyeStyle: number;
  personality: Personality;
  motif: QuizAnswers['creature'];
  form: QuizAnswers['form'];
  traits: string[];
}

export interface Palette {
  outline: string;
  light: string;
  mid: string;
  shade: string;
  inner: string;
  belly: string;
  accent: string;
  blush: string;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TONE_RANGES: Record<QuizAnswers['colorTone'], { hues: Array<[number, number]>; sat: number; light: number }> = {
  warm: { hues: [[330, 420]], sat: 62, light: 74 },
  cool: { hues: [[170, 280]], sat: 55, light: 72 },
  pastel: { hues: [[0, 360]], sat: 38, light: 82 },
  vivid: { hues: [[0, 360]], sat: 80, light: 66 },
  // 2026年トレンドのくすみ系(Mocha Mousse #A47764=HSL19/26/52、Lospec Nyx8系が根拠)
  dusty: { hues: [[0, 360]], sat: 26, light: 58 },
};

const CREATURE_EARS: Record<QuizAnswers['creature'], number> = {
  bird: 0,
  beast: 1,
  aquatic: 2,
  mythic: 3,
};

const PATTERNS: EggPattern[] = ['spots', 'stripes', 'swirl', 'stars'];

export function generateGenome(answers: QuizAnswers, seed: number): Genome {
  const rng = mulberry32(seed);
  const tone = TONE_RANGES[answers.colorTone];
  const [lo, hi] = tone.hues[Math.floor(rng() * tone.hues.length)];
  const hueBase = Math.floor(lo + rng() * (hi - lo)) % 360;
  const hueInner = (hueBase + 140 + Math.floor(rng() * 80)) % 360;
  const preferred = CREATURE_EARS[answers.creature];
  const earStyle = rng() < 0.75 ? preferred : Math.floor(rng() * 4);
  const tailStyle = rng() < 0.6 ? preferred : Math.floor(rng() * 4);
  return {
    version: 1,
    seed,
    hueBase,
    hueInner,
    sat: tone.sat,
    lightness: tone.light,
    pattern: PATTERNS[Math.floor(rng() * PATTERNS.length)],
    patternDensity: (1 + Math.floor(rng() * 3)) as 1 | 2 | 3,
    earStyle,
    tailStyle,
    eyeStyle: Math.floor(rng() * 3),
    personality: answers.workStyle === 'steady' ? 'nonbiri' : 'kibikibi',
    motif: answers.creature,
    form: answers.form,
    traits: [],
  };
}

export function generateEggOptions(answers: QuizAnswers, baseSeed: number, count = 3): Genome[] {
  const options: Genome[] = [];
  let seed = baseSeed;
  while (options.length < count) {
    const candidate = generateGenome(answers, seed);
    const tooSimilar = options.some(
      (g) =>
        hueDistance(g.hueBase, candidate.hueBase) < 26 ||
        (g.pattern === candidate.pattern && g.patternDensity === candidate.patternDensity),
    );
    if (!tooSimilar) options.push(candidate);
    seed = (seed * 1103515245 + 12345) >>> 0;
  }
  return options;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

const STAT_TRAITS: Record<StatKey, string> = {
  wisdom: 'antenna',
  technique: 'gear',
  resilience: 'armor',
  insight: 'thirdeye',
  discipline: 'crest',
  vitality: 'spark',
};

export function mutateOnEvolution(genome: Genome, dominantStat: StatKey): Genome {
  const trait = STAT_TRAITS[dominantStat];
  if (genome.traits.includes(trait)) return genome;
  return { ...genome, traits: [...genome.traits, trait] };
}

export function initialStatBonus(answers: QuizAnswers): { stat: StatKey; xp: number } {
  const map: Record<QuizAnswers['aiUse'], StatKey> = {
    code: 'technique',
    writing: 'wisdom',
    learning: 'insight',
    starter: 'vitality',
  };
  return { stat: map[answers.aiUse], xp: 10 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function paletteFromGenome(genome: Genome): Palette {
  const { hueBase: h, hueInner, sat, lightness } = genome;
  return {
    outline: hslToHex(h, Math.min(sat, 46), 24),
    light: hslToHex(h, sat, lightness + 12 > 92 ? 92 : lightness + 12),
    mid: hslToHex(h, sat, lightness),
    shade: hslToHex(h, sat, lightness - 16),
    inner: hslToHex(hueInner, Math.min(sat + 10, 85), 66),
    belly: hslToHex((h + 40) % 360, 42, 90),
    accent: '#FFD666',
    blush: hslToHex(350, 78, 82),
  };
}

export const MOTIF_LABELS: Record<QuizAnswers['creature'], string> = {
  bird: '鳥系',
  beast: '獣系',
  aquatic: '水棲系',
  mythic: '幻獣系',
};

export function parseGenome(json: string | null): Genome | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return parsed && parsed.version === 1 ? (parsed as Genome) : null;
  } catch {
    return null;
  }
}
