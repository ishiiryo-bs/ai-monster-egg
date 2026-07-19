import { generateGenome, type Genome, type QuizAnswers } from './genome';

// 引き継ぎコード: Web診断の結果(回答+選んだ卵のseed)をアプリへ持ち込むための短い文字列。
// generateGenome は決定的なので、回答とseedさえ復元できれば同じ卵が再生成できる。
//
// 2形式ある(デスクトップ側 ../ai-monster/src/core/eggCode.ts と仕様を揃えること):
// - 旧形式: EGG-XXX-XXX-XXX(本体8文字+チェック1)。value = seed×256 + packed8。
//   colorTone が2bitのため4色調まで。配布済みコードは全てこれで、無効化できない。
// - 拡張形式: EGG-XXX-XXX-XXXX(本体9文字+チェック1)。value = seed×512 + packed9。
//   colorTone 3bit。5色調目(dusty)以降はこちらで発行する。
//   旧4色調は今後も旧形式で発行し、既存コードとの見た目の一貫性を保つ。

const COLOR_TONES: QuizAnswers['colorTone'][] = ['warm', 'cool', 'pastel', 'vivid', 'dusty'];
const FORMS: QuizAnswers['form'][] = ['round', 'sharp'];
const WORK_STYLES: QuizAnswers['workStyle'][] = ['steady', 'burst'];
const AI_USES: QuizAnswers['aiUse'][] = ['code', 'writing', 'learning', 'starter'];
const CREATURES: QuizAnswers['creature'][] = ['bird', 'beast', 'aquatic', 'mythic'];

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BODY_LEN = 8;
const BODY_LEN_EXT = 9;
const LEGACY_TONE_COUNT = 4;

function packAnswers(answers: QuizAnswers): number {
  return (
    COLOR_TONES.indexOf(answers.colorTone) |
    (FORMS.indexOf(answers.form) << 2) |
    (WORK_STYLES.indexOf(answers.workStyle) << 3) |
    (AI_USES.indexOf(answers.aiUse) << 4) |
    (CREATURES.indexOf(answers.creature) << 6)
  );
}

function packAnswersExt(answers: QuizAnswers): number {
  return (
    COLOR_TONES.indexOf(answers.colorTone) |
    (FORMS.indexOf(answers.form) << 3) |
    (WORK_STYLES.indexOf(answers.workStyle) << 4) |
    (AI_USES.indexOf(answers.aiUse) << 5) |
    (CREATURES.indexOf(answers.creature) << 7)
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
  if (COLOR_TONES.indexOf(answers.colorTone) < LEGACY_TONE_COUNT) {
    const value = (seed >>> 0) * 256 + packAnswers(answers);
    const body = value.toString(36).toUpperCase().padStart(BODY_LEN, '0');
    const full = body + checkCharOf(body);
    return `EGG-${full.slice(0, 3)}-${full.slice(3, 6)}-${full.slice(6, 9)}`;
  }
  const value = (seed >>> 0) * 512 + packAnswersExt(answers);
  const body = value.toString(36).toUpperCase().padStart(BODY_LEN_EXT, '0');
  const full = body + checkCharOf(body);
  return `EGG-${full.slice(0, 3)}-${full.slice(3, 6)}-${full.slice(6, 10)}`;
}

export interface DecodedEgg {
  answers: QuizAnswers;
  seed: number;
  genome: Genome;
}

export function decodeEggCode(input: string): DecodedEgg | null {
  const cleaned = input.toUpperCase().replace(/[^0-9A-Z]/g, '');
  const stripped =
    (cleaned.length === BODY_LEN + 4 || cleaned.length === BODY_LEN_EXT + 4) &&
    cleaned.startsWith('EGG')
      ? cleaned.slice(3)
      : cleaned;
  if (stripped.length === BODY_LEN + 1) return decodeBody(stripped, false);
  if (stripped.length === BODY_LEN_EXT + 1) return decodeBody(stripped, true);
  return null;
}

function decodeBody(stripped: string, ext: boolean): DecodedEgg | null {
  const bodyLen = ext ? BODY_LEN_EXT : BODY_LEN;
  const body = stripped.slice(0, bodyLen);
  if (checkCharOf(body) !== stripped[bodyLen]) return null;
  const value = parseInt(body, 36);
  if (!Number.isFinite(value)) return null;
  const packSpan = ext ? 512 : 256;
  const packed = value % packSpan;
  const seed = Math.floor(value / packSpan);
  if (seed > 0xffffffff) return null;
  const colorTone = ext ? COLOR_TONES[packed & 0b111] : COLOR_TONES[packed & 0b11];
  if (!colorTone) return null;
  const answers: QuizAnswers = ext
    ? {
        colorTone,
        form: FORMS[(packed >> 3) & 0b1],
        workStyle: WORK_STYLES[(packed >> 4) & 0b1],
        aiUse: AI_USES[(packed >> 5) & 0b11],
        creature: CREATURES[(packed >> 7) & 0b11],
      }
    : {
        colorTone,
        form: FORMS[(packed >> 2) & 0b1],
        workStyle: WORK_STYLES[(packed >> 3) & 0b1],
        aiUse: AI_USES[(packed >> 4) & 0b11],
        creature: CREATURES[(packed >> 6) & 0b11],
      };
  return { answers, seed, genome: generateGenome(answers, seed) };
}
