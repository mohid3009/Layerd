const MOD = 8
const N = 12

// Pseudo-QR: deterministic grid with three position-detection squares.
// Stand-in for a real scannable code — plausible pattern only.
export default function QRBlock({ reference }) {
  let seed = 42
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  const cells = []
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inFinder =
        (x < 4 && y < 4) || (x >= N - 4 && y < 4) || (x < 4 && y >= N - 4)
      if (!inFinder && rnd() > 0.52) cells.push([x, y])
    }
  }
  const finder = (fx, fy) => (
    <g key={`${fx}-${fy}`}>
      <rect
        x={fx * MOD} y={fy * MOD} width={MOD * 3} height={MOD * 3}
        fill="none" stroke="#2B2E33" strokeWidth="2"
      />
      <rect x={fx * MOD + MOD * 0.75} y={fy * MOD + MOD * 0.75} width={MOD * 1.5} height={MOD * 1.5} fill="#2B2E33" />
    </g>
  )
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width={N * MOD} height={N * MOD} className="shrink-0 rounded-lg border border-linesoft">
        <rect width={N * MOD} height={N * MOD} fill="#FFFFFF" />
        {cells.map(([x, y]) => (
          <rect
            key={`${x}-${y}`}
            x={x * MOD + 1} y={y * MOD + 1} width={MOD - 2} height={MOD - 2}
            fill="#2B2E33"
          />
        ))}
        {finder(0, 0)}
        {finder(N - 3, 0)}
        {finder(0, N - 3)}
      </svg>
      <div>
        <div className="text-sm font-bold text-ink">Digitally verifiable record</div>
        <div className="text-xs text-ink-mid mt-0.5">
          Scan to confirm against the registry · Ref:{' '}
          <span className="font-id">{reference}</span>
        </div>
      </div>
    </div>
  )
}