import type { Status } from "./tipos";

export const ROTULO_STATUS: Record<Status, string> = {
  ABERTO: "Aberto",
  APROVADO: "Aprovado",
  EM_EXECUCAO: "Em execução",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const EDICAO_BLOQUEADA: Status[] = ["ENTREGUE", "CANCELADO"];

function dataLocal(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function formatarData(iso: string): string {
  return dataLocal(iso).toLocaleDateString("pt-BR");
}

export function partesData(iso: string): { diaSemana: string; dia: string; mes: string } {
  const d = dataLocal(iso);
  return {
    diaSemana: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    dia: String(d.getDate()).padStart(2, "0"),
    mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
  };
}

export function formatarHorario(hora: string): string {
  return hora.slice(0, 5);
}

/** Telefones são sempre do Brasil: o app guarda só DDD + número. */
export function telefoneInternacional(telefone: string): string {
  return `55${telefone.replace(/\D/g, "")}`;
}

export function dataISO(data: Date): string {
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const dd = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mm}-${dd}`;
}

export function somarDias(iso: string, dias: number): string {
  const d = dataLocal(iso);
  d.setDate(d.getDate() + dias);
  return dataISO(d);
}

/** "Hoje, terça 17", "Amanhã, quarta 18" ou "sexta 20 de nov". */
export function tituloDia(iso: string, hoje: string): string {
  const d = dataLocal(iso);
  const semana = d.toLocaleDateString("pt-BR", { weekday: "long" }).replace("-feira", "");
  const dia = d.getDate();
  if (iso === hoje) return `Hoje, ${semana} ${dia}`;
  if (iso === somarDias(hoje, 1)) return `Amanhã, ${semana} ${dia}`;
  const mes = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return `${semana} ${dia} de ${mes}`;
}

/** "qua 18", para os atalhos de dia do formulário. */
export function diaCurto(iso: string): string {
  const { diaSemana, dia } = partesData(iso);
  return `${diaSemana} ${Number(dia)}`;
}

export const SERVICOS_FREQUENTES = [
  "Revisão geral",
  "Ajuste de freio",
  "Regulagem de câmbio",
  "Troca de corrente",
  "Troca de pneu e câmara",
  "Alinhamento de roda",
];
