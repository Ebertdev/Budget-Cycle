import { useEffect, useState } from "react";
import { ApiError, listarOrcamentos } from "../api";
import { formatarReais, reaisParaCentavos } from "../dinheiro";
import { IcBusca, IcChevron, IcMais } from "../componentes/Icones";
import { Simbolo } from "../componentes/Marca";
import Selo from "../componentes/Selo";
import StatusChip from "../componentes/StatusChip";
import type { Orcamento, Pagina } from "../tipos";

interface Estado {
  carregando: boolean;
  erro?: string;
  dados?: Pagina<Orcamento>;
}

export function resumo(o: Orcamento): string {
  const servicos = o.servicos.map((s) => s.descricao).join(", ");
  if (o.pecas.length === 0) return servicos;
  return `${servicos} · ${o.pecas.length} ${o.pecas.length === 1 ? "peça" : "peças"}`;
}

export default function Lista() {
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(0);
  const [estado, setEstado] = useState<Estado>({ carregando: true });

  // Espera o atendente parar de digitar antes de consultar a API.
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAplicada(busca);
      setPagina(0);
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    let cancelado = false;
    setEstado((e) => ({ ...e, carregando: true, erro: undefined }));
    listarOrcamentos({ busca: buscaAplicada, page: pagina })
      .then((dados) => !cancelado && setEstado({ carregando: false, dados }))
      .catch((e: unknown) => {
        if (cancelado) return;
        const msg = e instanceof ApiError ? e.message : "Não foi possível carregar os orçamentos";
        setEstado({ carregando: false, erro: msg });
      });
    return () => {
      cancelado = true;
    };
  }, [buscaAplicada, pagina]);

  const { dados, carregando, erro } = estado;
  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.totalElements / dados.size)) : 1;
  const filtrando = buscaAplicada.trim() !== "";

  return (
    <section>
      <div className="barra-titulo">
        <Simbolo tamanho={28} />
        <a className="botao-icone" href="#/novo" aria-label="Novo orçamento">
          <IcMais />
        </a>
      </div>
      <h1 className="titulo-grande">Orçamentos</h1>

      <form className="busca" role="search" onSubmit={(e) => e.preventDefault()}>
        <IcBusca tamanho={20} />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome ou telefone"
          aria-label="Buscar por nome ou telefone"
          autoComplete="off"
        />
      </form>

      <div aria-live="polite">
        {erro && (
          <p className="mensagem erro-geral" role="alert">
            {erro}
          </p>
        )}
        {carregando && !dados && <p className="vazio">Carregando orçamentos…</p>}
        {dados && dados.content.length === 0 && !erro && (
          <p className="vazio">
            {filtrando
              ? "Nenhum orçamento encontrado para essa busca."
              : "Nenhum orçamento ainda. Toque em + para registrar o primeiro."}
          </p>
        )}
      </div>

      {dados && dados.content.length > 0 && (
        <ul className="grupo" aria-busy={carregando}>
          {dados.content.map((o) => (
            <li key={o.id}>
              <a className="linha" href={`#/orcamento/${o.id}`}>
                <Selo data={o.dataEntrega} horario={o.horarioEntrega} />
                <div className="linha-corpo">
                  <strong className="linha-nome">{o.nomeCliente}</strong>
                  <span className="linha-resumo">{resumo(o)}</span>
                  <span className="linha-rodape">
                    <StatusChip status={o.status} />
                    <span className="linha-total">{formatarReais(reaisParaCentavos(o.valorTotal))}</span>
                  </span>
                </div>
                <span className="linha-seta">
                  <IcChevron tamanho={18} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {dados && totalPaginas > 1 && (
        <nav className="paginacao" aria-label="Páginas de orçamentos">
          <button className="botao" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>
            Anterior
          </button>
          <span>
            Página {pagina + 1} de {totalPaginas}
          </span>
          <button
            className="botao"
            disabled={pagina + 1 >= totalPaginas}
            onClick={() => setPagina(pagina + 1)}
          >
            Próxima
          </button>
        </nav>
      )}
    </section>
  );
}
