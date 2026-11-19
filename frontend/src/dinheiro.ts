/** Valores em reais são tratados em centavos inteiros para não acumular erro de ponto flutuante. */

/** Lê "45", "45,5", "1.234,50" ou "R$ 89,90". Devolve null se não for um valor válido (até 2 casas, sem sinal). */
export function paraCentavos(texto: string): number | null {
  let t = texto.replace(/R\$/gi, "").replace(/\s/g, "");
  if (t === "") return null;
  if (t.includes(",")) {
    if (t.indexOf(",") !== t.lastIndexOf(",")) return null;
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, ""); // 1.234 é mil duzentos e trinta e quatro
  }
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(t);
  if (!m) return null;
  const centavos = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || 0);
  return Number.isSafeInteger(centavos) && centavos <= 9_999_999_999 ? centavos : null;
}

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarReais(centavos: number): string {
  return MOEDA.format(centavos / 100);
}

/** Texto para preencher o campo ao editar: 12000 vira "120,00". */
export function centavosParaTexto(centavos: number): string {
  const reais = Math.floor(centavos / 100);
  return `${reais},${String(centavos % 100).padStart(2, "0")}`;
}

/** Valor que a API devolve (número em reais) convertido para centavos. */
export function reaisParaCentavos(reais: number): number {
  return Math.round(reais * 100);
}

/** Soma o que já está preenchido: campos vazios ou inválidos contam como zero enquanto se digita. */
export function totalEmCentavos(f: {
  servicos: { valor: string }[];
  pecas: { quantidade: string; valorUnitario: string }[];
}): number {
  let total = 0;
  for (const s of f.servicos) total += paraCentavos(s.valor) ?? 0;
  for (const p of f.pecas) {
    const q = Number(p.quantidade);
    if (Number.isInteger(q) && q >= 1) total += (paraCentavos(p.valorUnitario) ?? 0) * q;
  }
  return total;
}
