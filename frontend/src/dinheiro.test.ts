import { describe, expect, it } from "vitest";
import { centavosParaTexto, formatarReais, paraCentavos, totalEmCentavos } from "./dinheiro";

const sem = (s: string) => s.replace(/ /g, " ");

describe("paraCentavos", () => {
  it("lê valores no formato brasileiro", () => {
    expect(paraCentavos("45")).toBe(4500);
    expect(paraCentavos("45,5")).toBe(4550);
    expect(paraCentavos("45,50")).toBe(4550);
    expect(paraCentavos("1.234,50")).toBe(123450);
    expect(paraCentavos("R$ 89,90")).toBe(8990);
    expect(paraCentavos("0")).toBe(0);
    expect(paraCentavos("0,00")).toBe(0);
  });
  it("aceita ponto como decimal quando há até 2 casas", () => {
    expect(paraCentavos("45.50")).toBe(4550);
    expect(paraCentavos("1.234")).toBe(123400);
  });
  it("não erra por arredondamento de ponto flutuante", () => {
    expect(paraCentavos("0,29")).toBe(29);
    expect(paraCentavos("1,15")).toBe(115);
  });
  it("rejeita vazio, texto, negativo e mais de 2 casas", () => {
    for (const ruim of ["", "  ", "abc", "-5", "12,345", "1,2,3", "12a"]) {
      expect(paraCentavos(ruim), ruim).toBeNull();
    }
  });
});

describe("formatarReais e centavosParaTexto", () => {
  it("formata em reais", () => {
    expect(sem(formatarReais(123450))).toBe("R$ 1.234,50");
    expect(sem(formatarReais(0))).toBe("R$ 0,00");
  });
  it("devolve texto editável para o campo", () => {
    expect(centavosParaTexto(12000)).toBe("120,00");
    expect(centavosParaTexto(3550)).toBe("35,50");
  });
});

describe("totalEmCentavos", () => {
  it("soma serviços e peças (valor unitário vezes quantidade)", () => {
    const total = totalEmCentavos({
      servicos: [{ valor: "120,00" }, { valor: "35,50" }],
      pecas: [{ quantidade: "2", valorUnitario: "30,00" }],
    });
    expect(total).toBe(21550);
  });
  it("ignora campos vazios ou inválidos enquanto a pessoa digita", () => {
    expect(
      totalEmCentavos({
        servicos: [{ valor: "" }, { valor: "abc" }, { valor: "10" }],
        pecas: [{ quantidade: "x", valorUnitario: "5" }],
      }),
    ).toBe(1000);
  });
});
