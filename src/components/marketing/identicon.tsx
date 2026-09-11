/**
 * A generated avatar, in the style GitHub uses for accounts with no picture.
 *
 * Deliberately not a photograph of a person: the comment beside it on the
 * landing page is an illustration, and putting a real face next to words
 * somebody never said would misrepresent them.
 */
export function Identicon({ seed, size = 24 }: { seed: string; size?: number }) {
  // A small deterministic hash, so the same name always draws the same mark.
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  const cells: boolean[] = [];
  for (let index = 0; index < 15; index += 1) {
    cells.push(((hash >> index % 28) & 1) === 1);
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 5 5"
      aria-hidden
      focusable="false"
      className="shrink-0 rounded"
      style={{ background: `hsl(${hue} 24% 92%)` }}
    >
      {cells.map((filled, index) => {
        if (!filled) return null;
        const column = Math.floor(index / 5);
        const row = index % 5;
        return (
          <g key={index} fill={`hsl(${hue} 42% 42%)`}>
            <rect x={column} y={row} width="1" height="1" />
            {/* Mirrored, which is what makes an identicon read as a face. */}
            <rect x={4 - column} y={row} width="1" height="1" />
          </g>
        );
      })}
    </svg>
  );
}
