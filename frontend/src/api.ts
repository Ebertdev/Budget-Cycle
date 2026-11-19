import type { Orcamento, OrcamentoPayload, Pagina, Status } from "./tipos";

const BASE = `${import.meta.env.VITE_API_URL ?? ""}/api/v1/orcamentos`;

export class ApiError extends Error {
  constructor(
    public status: number,
    mensagem: string,
    public campos: { campo: string; mensagem: string }[] = [],
  ) {
    super(mensagem);
  }
}

async function chamar<T>(url: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "Sem conexão com o servidor. Verifique a internet e tente de novo.");
  }
  if (resposta.status === 204) return undefined as T;
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ApiError(
      resposta.status,
      corpo?.erro ?? "Não foi possível concluir a operação",
      corpo?.campos ?? [],
    );
  }
  return corpo as T;
}

export interface FiltroLista {
  busca?: string;
  dataEntrega?: string;
  /** Entregas a partir desta data (aaaa-mm-dd), inclusive. */
  entregaDe?: string;
  /** Entregas até esta data (aaaa-mm-dd), inclusive. */
  entregaAte?: string;
  /** Só orçamentos ainda não entregues nem cancelados. */
  pendentes?: boolean;
  /** Ordem cronológica de entrega (dia e horário). */
  ordemCrescente?: boolean;
  page?: number;
  size?: number;
}

export function listarOrcamentos(filtro: FiltroLista): Promise<Pagina<Orcamento>> {
  const q = new URLSearchParams({
    page: String(filtro.page ?? 0),
    size: String(filtro.size ?? 10),
  });
  if (filtro.busca?.trim()) q.set("busca", filtro.busca.trim());
  if (filtro.dataEntrega) q.set("dataEntrega", filtro.dataEntrega);
  if (filtro.entregaDe) q.set("entregaDe", filtro.entregaDe);
  if (filtro.entregaAte) q.set("entregaAte", filtro.entregaAte);
  if (filtro.pendentes) q.set("pendentes", "true");
  if (filtro.ordemCrescente) {
    q.append("sort", "dataEntrega,asc");
    q.append("sort", "horarioEntrega,asc");
  }
  return chamar(`${BASE}?${q}`);
}

export const mudarStatus = (id: number, status: Status) =>
  chamar<Orcamento>(`${BASE}/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const buscarOrcamento = (id: number) => chamar<Orcamento>(`${BASE}/${id}`);

export const criarOrcamento = (dados: OrcamentoPayload) =>
  chamar<Orcamento>(BASE, { method: "POST", body: JSON.stringify(dados) });

export const atualizarOrcamento = (id: number, dados: OrcamentoPayload) =>
  chamar<Orcamento>(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(dados) });

export const excluirOrcamento = (id: number) =>
  chamar<void>(`${BASE}/${id}`, { method: "DELETE" });
