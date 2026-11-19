export function Simbolo({ tamanho = 32 }: { tamanho?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={tamanho} height={tamanho} aria-hidden="true" className="simbolo">
      <path
        d="M46.14 15.15A22 22 0 1 1 24.48 11.33"
        fill="none"
        stroke="var(--tint)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M26.9 17.9L33.6 8.1L22.1 4.8Z" fill="var(--tint)" />
      <path
        d="M22 33L29 40L43 25"
        fill="none"
        stroke="var(--label)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Marca() {
  return (
    <span className="marca">
      <Simbolo tamanho={30} />
      <span className="marca-nome">Budgetcycle</span>
    </span>
  );
}
