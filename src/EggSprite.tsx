import { mulberry32, paletteFromGenome, type Genome } from './genome';

type Cell = [number, number];

const BASE: Array<{ r: number; o: number[][]; l: number[][]; s: number[][] }> = [
  { r: 0, o: [[3, 5]], l: [], s: [] },
  { r: 1, o: [[2, 2], [6, 6]], l: [[3, 5]], s: [] },
  { r: 2, o: [[1, 1], [7, 7]], l: [[2, 6]], s: [] },
  { r: 3, o: [[1, 1], [7, 7]], l: [[2, 6]], s: [] },
  { r: 4, o: [[0, 0], [8, 8]], l: [[1, 6]], s: [[7, 7]] },
  { r: 5, o: [[0, 0], [8, 8]], l: [[1, 6]], s: [[7, 7]] },
  { r: 6, o: [[0, 0], [8, 8]], l: [[1, 5]], s: [[6, 7]] },
  { r: 7, o: [[0, 0], [8, 8]], l: [[1, 4]], s: [[5, 7]] },
  { r: 8, o: [[1, 1], [7, 7]], l: [[2, 4]], s: [[5, 6]] },
  { r: 9, o: [[2, 2], [6, 6]], l: [], s: [[3, 5]] },
  { r: 10, o: [[3, 5]], l: [], s: [] },
];

const CANDIDATES: Cell[] = [];
for (const row of BASE) {
  for (const [from, to] of row.l) {
    for (let c = from; c <= to; c++) CANDIDATES.push([c, row.r]);
  }
}

function patternCells(genome: Genome): { inner: Cell[]; accent: Cell[] } {
  const rng = mulberry32((genome.seed ^ 0x9e3779b9) >>> 0);
  const inner: Cell[] = [];
  const accent: Cell[] = [];
  const pick = (): Cell => CANDIDATES[Math.floor(rng() * CANDIDATES.length)];
  const density = genome.patternDensity;

  if (genome.pattern === 'spots') {
    for (let i = 0; i < 3 + density * 2; i++) inner.push(pick());
  } else if (genome.pattern === 'stripes') {
    const rows = new Set<number>();
    while (rows.size < 1 + density) rows.add(1 + Math.floor(rng() * 8));
    for (const [c, r] of CANDIDATES) {
      if (rows.has(r) && c % 2 === r % 2) inner.push([c, r]);
    }
  } else if (genome.pattern === 'swirl') {
    const SWIRL: Cell[] = [
      [4, 2], [5, 3], [5, 4], [4, 5], [3, 5], [2, 4], [3, 3], [4, 4],
    ];
    inner.push(...SWIRL.slice(0, 3 + density * 2));
  } else {
    for (let i = 0; i < 1 + density; i++) accent.push(pick());
    inner.push(pick());
  }
  return { inner, accent };
}

export function EggSprite({ genome, cell = 7 }: { genome: Genome; cell?: number }) {
  const palette = paletteFromGenome(genome);
  const { inner, accent } = patternCells(genome);
  const rects: Array<{ x: number; y: number; w: number; fill: string }> = [];

  for (const row of BASE) {
    for (const [from, to] of row.o) rects.push({ x: from, y: row.r, w: to - from + 1, fill: palette.outline });
    for (const [from, to] of row.l) rects.push({ x: from, y: row.r, w: to - from + 1, fill: palette.light });
    for (const [from, to] of row.s) rects.push({ x: from, y: row.r, w: to - from + 1, fill: palette.shade });
  }
  for (const [c, r] of inner) rects.push({ x: c, y: r, w: 1, fill: palette.inner });
  for (const [c, r] of accent) rects.push({ x: c, y: r, w: 1, fill: palette.accent });

  return (
    <svg
      viewBox={`0 0 ${9 * cell} ${11 * cell}`}
      width={9 * cell}
      height={11 * cell}
      shapeRendering="crispEdges"
    >
      {rects.map((rect, i) => (
        <rect key={i} x={rect.x * cell} y={rect.y * cell} width={rect.w * cell} height={cell} fill={rect.fill} />
      ))}
    </svg>
  );
}
