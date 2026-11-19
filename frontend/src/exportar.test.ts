import { describe, expect, it } from "vitest";
import { nomeArquivo, textoOrcamento } from "./exportar";
import type { Orcamento } from "./tipos";

const base: Orcamento = {
  id: 7,
  nomeCliente: "João Álvares",
  telefone: "71999990000",
  dataEntrega: "2026-11-20",
  horarioEntrega: "15:30:00",
  status: "ABERTO",
  observacoes: null,
  servicos: [
    { id: 1, descricao: "Revisão geral", valor: 120 },
    { id: 2, descricao: "Ajuste de freio", valor: 35.5 },
  ],
  pecas: [{ id: 1, nomePeca: "Câmara de ar aro 29", quantidade: 2, valorUnitario: 30, subtotal: 60 }],
  valorTotal: 215.5,
  dataOrcamento: "2026-11-17",
  criadoEm: "2026-11-17T09:00:00",
  atualizadoEm: "2026-11-17T09:00:00",
  avisos: [],
};

const normal = (t: string) => t.replace(/ /g, " ");

describe("textoOrcamento", () => {
  it("traz a data do orçamento, a entrega, os itens e o total", () => {
    const t = normal(textoOrcamento(base));
    expect(t).toContain("Feito em 17/11/2026");
    expect(t).toContain("Entrega: 20/11/2026 às 15:30");
    expect(t).toContain("Telefone: (71) 99999-0000");
    expect(t).toContain("- Revisão geral: R$ 120,00");
    expect(t).toContain("- Câmara de ar aro 29 (2× R$ 30,00): R$ 60,00");
    expect(t).toContain("*Total: R$ 215,50*");
  });

  it("omite a seção de peças e as observações quando não há", () => {
    const t = textoOrcamento({ ...base, pecas: [] });
    expect(t).not.toContain("Peças");
    expect(t).not.toContain("Observações");
  });

  it("inclui observações quando existem", () => {
    expect(textoOrcamento({ ...base, observacoes: "Cliente leva o capacete" })).toContain(
      "Observações: Cliente leva o capacete",
    );
  });
});

describe("nomeArquivo", () => {
  it("remove acentos e símbolos do nome do cliente", () => {
    expect(nomeArquivo(base)).toBe("orcamento-7-joao-alvares.pdf");
  });
  it("usa um nome padrão quando o nome não tem letras", () => {
    expect(nomeArquivo({ ...base, nomeCliente: "!!!" })).toBe("orcamento-7-cliente.pdf");
  });
});
