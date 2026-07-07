import { generateGenome, type Genome, type QuizAnswers } from './genome';

// 引き継ぎコード: Web診断の結果(回答+選んだ卵のseed)をアプリへ持ち込むための短い文字列。
// generateGenome は決定的なので、回答とseedさえ復元できれば同じ卵が再生成できる。
// フォーマット: EGG-XXX-XXX-XXX(base36の本体8文字+チェック文字1文字)

const COLOR_TONES: QuizAnswers['colorTone'][] = ['warm', 'cool', 'pastel', 'vivid'];
const FORMS: QuizAnswers['form'][] = ['round', 'sharp'];
const WORK_STYLES: QuizAnswers['workStyle'][] = ['steady', 'burst'];
const AI_USES: QuizAnswers['aiUse'][] = ['code', 'writing', 'learning', 'starter'];
const CREATURES: QuizAnswers['creature'][] = ['bird', 'beast', 'aquatic', 'mythic'];

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BODY_LEN = 8;

function packAnswers(answers: QuizAnswers): number {
  return (
    COLOR_TONES.indexOf(answers.colorTone) |
    (FORMS.indexOf(answers.form) << 2) |
    (WORK_STYLES.indexOf(answers.workStyle) << 3) |
    (AI_USES.indexOf(answers.aiUse) << 4) |
    (CREATURES.indexOf(answers.creature) << 6)
  );
}

// 位置重み付きチェックサム: 1文字の打ち間違いと隣接文字の入れ替わりを検出する
function checkCharOf(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    sum = (sum + ALPHABET.indexOf(body[i]) * (i + 1)) % 36;
  }
  return ALPHABET[sum];
}

export function encodeEggCode(answers: QuizAnswers, seed: number): string {
  const value = (seed >>> 0) * 256 + packAnswers(answers);
  const body = value.toString(36).toUpperCase().padStart(BODY_LEN, '0');
  const full = body + checkCharOf(body);
  return `EGG-${full.slice(0, 3)}-${full.slice(3, 6)}-${full.slice(6, 9)}`;
}

export interface DecodedEgg {
  answers: QuizAnswers;
  seed: number;
  genome: Genome;
}

export function decodeEggCode(input: string): DecodedEgg | null {
  const cleaned = input.toUpperCase().replace(/[^0-9A-Z]/g, '');
  const stripped =
    cleaned.length === BODY_LEN + 4 && cleaned.startsWith('EGG') ? cleaned.slice(3) : cleaned;
  if (stripped.length !== BODY_LEN + 1) return null;
  const body = stripped.slice(0, BODY_LEN);
  if (checkCharOf(body) !== stripped[BODY_LEN]) return null;
  const value = parseInt(body, 36);
  if (!Number.isFinite(value)) return null;
  const packed = value % 256;
  const seed = Math.floor(value / 256);
  if (seed > 0xffffffff) return null;
  const answers: QuizAnswers = {
    colorTone: COLOR_TONES[packed & 0b11],
    form: FORMS[(packed >> 2) & 0b1],
    workStyle: WORK_STYLES[(packed >> 3) & 0b1],
    aiUse: AI_USES[(packed >> 4) & 0b11],
    creature: CREATURES[(packed >> 6) & 0b11],
  };
  return { answers, seed, genome: generateGenome(answers, seed) };
}
