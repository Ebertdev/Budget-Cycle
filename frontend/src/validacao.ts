import { paraCentavos } from "./dinheiro";

export interface FormOrcamento {
  nomeCliente: string;
  telefone: string; // com máscara, como digitado
  dataEntrega: string; // aaaa-mm-dd
  horarioEntrega: string; // HH:mm
  observacoes: string;
  servicos: { descricao: string; valor: string }[];
  pecas: { nomePeca: string; quantidade: string; valorUnitario: string }[];
}

export type Erros = Record<string, string>;

export function soDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function formatarTelefone(valor: string): string {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

export function hojeISO(data: Date = new Date()): string {
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const dd = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mm}-${dd}`;
}

/** Aplica trim e descarta linhas de serviço e peça totalmente vazias. */
export function limparForm(f: FormOrcamento): FormOrcamento {
  return {
    ...f,
    nomeCliente: f.nomeCliente.trim(),
    observacoes: f.observacoes.trim(),
    servicos: f.servicos
      .map((s) => ({ descricao: s.descricao.trim(), valor: s.valor.trim() }))
      .filter((s) => s.descricao !== ""),
    pecas: f.pecas
      .map((p) => ({
        nomePeca: p.nomePeca.trim(),
        quantidade: p.quantidade,
        valorUnitario: p.valorUnitario.trim(),
      }))
      .filter((p) => p.nomePeca !== ""),
  };
}

/** Zero é aceito (serviço sem cobrança), mas o campo não pode ficar em branco. */
export function validarValor(texto: string): string | undefined {
  if (texto.trim() === "") return "Informe o valor (0,00 se não houver cobrança)";
  if (paraCentavos(texto) === null) return "Valor inválido. Use o formato 45,90";
  return undefined;
}

export function validarOrcamento(f: FormOrcamento, hoje: Date = new Date()): Erros {
  const erros: Erros = {};

  if (f.nomeCliente.trim() === "") erros.nomeCliente = "Informe o nome do cliente";
  else if (f.nomeCliente.trim().length > 100) erros.nomeCliente = "Use no máximo 100 caracteres";

  const digitos = soDigitos(f.telefone);
  if (digitos.length < 10 || digitos.length > 11) {
    erros.telefone = "Informe o DDD e 8 ou 9 dígitos";
  }

  if (f.dataEntrega === "") erros.dataEntrega = "Informe a data de entrega";
  else if (f.dataEntrega < hojeISO(hoje)) erros.dataEntrega = "A data não pode ser passada";

  if (f.horarioEntrega === "") erros.horarioEntrega = "Informe o horário de entrega";

  if (f.servicos.length === 0) erros.servicos = "Informe ao menos um serviço";
  f.servicos.forEach((s, i) => {
    if (s.descricao.trim() === "") erros[`servicos.${i}.descricao`] = "Descreva o serviço";
    const erroValor = validarValor(s.valor);
    if (erroValor) erros[`servicos.${i}.valor`] = erroValor;
  });

  f.pecas.forEach((p, i) => {
    if (p.nomePeca.trim() === "") erros[`pecas.${i}.nomePeca`] = "Informe o nome da peça";
    const q = Number(p.quantidade);
    if (!Number.isInteger(q) || q < 1) {
      erros[`pecas.${i}.quantidade`] = "A quantidade deve ser pelo menos 1";
    }
    const erroValor = validarValor(p.valorUnitario);
    if (erroValor) erros[`pecas.${i}.valorUnitario`] = erroValor;
  });

  return erros;
}
