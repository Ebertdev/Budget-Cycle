import { describe, expect, it } from "vitest";
import { diaCurto, somarDias, telefoneInternacional, tituloDia } from "./formato";
import { agruparPorDia } from "./paginas/Entregas";
import type { Orcamento } from "./tipos";

describe("formato", () => {
  it("prefixa todo telefone com o código do Brasil", () => {
    expect(telefoneInternacional("(71) 99999-0000")).toBe("5571999990000");
    expect(telefoneInternacional("7133334444")).toBe("557133334444");
  });

  it("soma dias atravessando o fim do mês", () => {
    expect(somarDias("2026-11-30", 1)).toBe("2026-12-01");
  });

  it("titula o dia como Hoje, Amanhã ou data por extenso", () => {
    expect(tituloDia("2026-11-17", "2026-11-17")).toBe("Hoje, terça 17");
    expect(tituloDia("2026-11-18", "2026-11-17")).toBe("Amanhã, quarta 18");
    expect(tituloDia("2026-11-20", "2026-11-17")).toBe("sexta 20 de nov");
    expect(diaCurto("2026-11-19")).toBe("qui 19");
  });

  it("agrupa entregas consecutivas do mesmo dia", () => {
    const o = (id: number, dataEntrega: string) => ({ id, dataEntrega }) as Orcamento;
    const grupos = agruparPorDia([o(1, "2026-11-17"), o(2, "2026-11-17"), o(3, "2026-11-18")]);
    expect(grupos.map((g) => [g.dia, g.itens.length])).toEqual([
      ["2026-11-17", 2],
      ["2026-11-18", 1],
    ]);
  });
});
