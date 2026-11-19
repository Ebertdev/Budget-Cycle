export type Status =
  | "ABERTO"
  | "APROVADO"
  | "EM_EXECUCAO"
  | "PRONTO"
  | "ENTREGUE"
  | "CANCELADO";

export interface Orcamento {
  id: number;
  nomeCliente: string;
  telefone: string;
  dataEntrega: string;
  horarioEntrega: string;
  status: Status;
  observacoes: string | null;
  servicos: { id: number; descricao: string; valor: number }[];
  pecas: {
    id: number;
    nomePeca: string;
    quantidade: number;
    valorUnitario: number;
    subtotal: number;
  }[];
  valorTotal: number;
  dataOrcamento: string;
  criadoEm: string;
  atualizadoEm: string;
  avisos: string[];
}

export interface Pagina<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
}

export interface OrcamentoPayload {
  nomeCliente: string;
  telefone: string;
  dataEntrega: string;
  horarioEntrega: string;
  observacoes: string;
  servicos: { descricao: string; valor: number }[];
  pecas: { nomePeca: string; quantidade: number; valorUnitario: number }[];
}
