import { describe, expect, it } from "vitest";
import {
  formatarTelefone,
  hojeISO,
  limparForm,
  soDigitos,
  validarOrcamento,
  validarValor,
  type FormOrcamento,
} from "./validacao";

const hoje = new Date(2026, 10, 16); // 16/11/2026, hora local

function formValido(): FormOrcamento {
  return {
    nomeCliente: "Maria Souza",
    telefone: "(71) 99999-0000",
    dataEntrega: "2026-11-20",
    horarioEntrega: "15:30",
    observacoes: "",
    servicos: [{ descricao: "Revisão geral", valor: "120,00" }],
    pecas: [],
  };
}

describe("formatarTelefone", () => {
  it("formata celular com 11 dígitos", () => {
    expect(formatarTelefone("71999990000")).toBe("(71) 99999-0000");
  });
  it("formata fixo com 10 dígitos", () => {
    expect(formatarTelefone("7133334444")).toBe("(71) 3333-4444");
  });
  it("formata parcialmente enquanto digita", () => {
    expect(formatarTelefone("7")).toBe("(7");
    expect(formatarTelefone("719")).toBe("(71) 9");
  });
  it("ignora letras e limita a 11 dígitos", () => {
    expect(formatarTelefone("71a99999-0000999")).toBe("(71) 99999-0000");
  });
});

describe("soDigitos", () => {
  it("remove a máscara", () => {
    expect(soDigitos("(71) 99999-0000")).toBe("71999990000");
  });
});

describe("hojeISO", () => {
  it("usa a data local no formato aaaa-mm-dd", () => {
    expect(hojeISO(hoje)).toBe("2026-11-16");
  });
});

describe("validarOrcamento", () => {
  it("aceita um orçamento válido sem peças", () => {
    expect(validarOrcamento(formValido(), hoje)).toEqual({});
  });
  it("exige o nome", () => {
    const f = { ...formValido(), nomeCliente: "  " };
    expect(validarOrcamento(f, hoje).nomeCliente).toBeDefined();
  });
  it("rejeita telefone com menos de 10 dígitos", () => {
    const f = { ...formValido(), telefone: "(71) 9999" };
    expect(validarOrcamento(f, hoje).telefone).toBeDefined();
  });
  it("rejeita data passada e aceita hoje", () => {
    expect(
      validarOrcamento({ ...formValido(), dataEntrega: "2026-11-15" }, hoje).dataEntrega,
    ).toBeDefined();
    expect(
      validarOrcamento({ ...formValido(), dataEntrega: "2026-11-16" }, hoje).dataEntrega,
    ).toBeUndefined();
  });
  it("exige data e horário", () => {
    const erros = validarOrcamento({ ...formValido(), dataEntrega: "", horarioEntrega: "" }, hoje);
    expect(erros.dataEntrega).toBeDefined();
    expect(erros.horarioEntrega).toBeDefined();
  });
  it("exige ao menos um serviço", () => {
    const f = { ...formValido(), servicos: [] };
    expect(validarOrcamento(f, hoje).servicos).toBeDefined();
  });
  it("valida nome e quantidade da peça", () => {
    const f = { ...formValido(), pecas: [{ nomePeca: "", quantidade: "0", valorUnitario: "5" }] };
    const erros = validarOrcamento(f, hoje);
    expect(erros["pecas.0.nomePeca"]).toBeDefined();
    expect(erros["pecas.0.quantidade"]).toBeDefined();
  });
});

describe("limparForm", () => {
  it("remove linhas totalmente vazias de serviços e peças e apara os textos", () => {
    const f: FormOrcamento = {
      ...formValido(),
      nomeCliente: "  Maria  ",
      servicos: [
        { descricao: " Revisão ", valor: "10" },
        { descricao: "   ", valor: "" },
      ],
      pecas: [
        { nomePeca: "", quantidade: "1", valorUnitario: "" },
        { nomePeca: "Corrente", quantidade: "2", valorUnitario: "5" },
      ],
    };
    const limpo = limparForm(f);
    expect(limpo.nomeCliente).toBe("Maria");
    expect(limpo.servicos).toEqual([{ descricao: "Revisão", valor: "10" }]);
    expect(limpo.pecas).toEqual([{ nomePeca: "Corrente", quantidade: "2", valorUnitario: "5" }]);
  });
});

describe("valores", () => {
  it("exige o valor de cada serviço, mas aceita zero", () => {
    const sem = { ...formValido(), servicos: [{ descricao: "Revisão geral", valor: "" }] };
    expect(validarOrcamento(sem, hoje)["servicos.0.valor"]).toBeDefined();
    const zero = { ...formValido(), servicos: [{ descricao: "Revisão geral", valor: "0,00" }] };
    expect(validarOrcamento(zero, hoje)).toEqual({});
  });
  it("exige o valor unitário de cada peça", () => {
    const f = {
      ...formValido(),
      pecas: [{ nomePeca: "Corrente", quantidade: "1", valorUnitario: "" }],
    };
    expect(validarOrcamento(f, hoje)["pecas.0.valorUnitario"]).toBeDefined();
  });
  it("rejeita valor negativo, com texto ou com 3 casas", () => {
    for (const ruim of ["-1", "abc", "1,234"]) expect(validarValor(ruim), ruim).toBeDefined();
    expect(validarValor("1.234,50")).toBeUndefined();
  });
  it("limparForm mantém os valores digitados", () => {
    const f = limparForm({
      ...formValido(),
      servicos: [{ descricao: " Revisão ", valor: " 10 " }],
      pecas: [{ nomePeca: " Corrente ", quantidade: "1", valorUnitario: " 5 " }],
    });
    expect(f.servicos[0]).toEqual({ descricao: "Revisão", valor: "10" });
    expect(f.pecas[0]).toEqual({ nomePeca: "Corrente", quantidade: "1", valorUnitario: "5" });
  });
});
