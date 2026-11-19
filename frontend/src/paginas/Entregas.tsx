import { useEffect, useState } from "react";
import { ApiError, listarOrcamentos } from "../api";
import { formatarReais, reaisParaCentavos } from "../dinheiro";
import { IcChevron } from "../componentes/Icones";
import Selo from "../componentes/Selo";
import StatusChip from "../componentes/StatusChip";
import { dataISO, somarDias, tituloDia } from "../formato";
import type { Orcamento } from "../tipos";
import { resumo } from "./Lista";

type Periodo = "hoje" | "semana" | "todas";
const PERIODOS: { id: Periodo; rotulo: string }[] = [
  { id: "hoje", rotulo: "Hoje" },
  { id: "semana", rotulo: "Semana" },
  { id: "todas", rotulo: "Todas" },
];

export function agruparPorDia(lista: Orcamento[]): { dia: string; itens: Orcamento[] }[] {
  const grupos: { dia: string; itens: Orcamento[] }[] = [];
  for (const o of lista) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.dia === o.dataEntrega) ultimo.itens.push(o);
    else grupos.push({ dia: o.dataEntrega, itens: [o] });
  }
  return grupos;
}

export default function Entregas() {
  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [estado, setEstado] = useState<{ carregando: boolean; erro?: string; lista?: Orcamento[] }>({
    carregando: true,
  });
  const hoje = dataISO(new Date());

  useEffect(() => {
    let cancelado = false;
    setEstado((e) => ({ ...e, carregando: true, erro: undefined }));
    listarOrcamentos({
      entregaDe: hoje,
      entregaAte: periodo === "hoje" ? hoje : periodo === "semana" ? somarDias(hoje, 6) : undefined,
      pendentes: true,
      ordemCrescente: true,
      size: 100,
    })
      .then((p) => !cancelado && setEstado({ carregando: false, lista: p.content }))
      .catch((e: unknown) => {
        if (cancelado) return;
        setEstado({
          carregando: false,
          erro: e instanceof ApiError ? e.message : "Não foi possível carregar as entregas",
        });
      });
    return () => {
      cancelado = true;
    };
  }, [periodo, hoje]);

  const { lista, carregando, erro } = estado;
  const grupos = lista ? agruparPorDia(lista) : [];

  return (
    <section>
      <h1 className="titulo-grande">Entregas</h1>

      <div role="tablist" aria-label="Período" className="segmentado">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            role="tab"
            id={`aba-${p.id}`}
            aria-selected={periodo === p.id}
            aria-controls="painel-entregas"
            onClick={() => setPeriodo(p.id)}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      <div id="painel-entregas" role="tabpanel" aria-labelledby={`aba-${periodo}`} aria-live="polite">
        {erro && (
          <p className="mensagem erro-geral" role="alert">
            {erro}
          </p>
        )}
        {carregando && !lista && <p className="vazio">Carregando entregas…</p>}
        {lista && lista.length === 0 && !erro && (
          <p className="vazio">
            {periodo === "hoje"
              ? "Nenhuma entrega para hoje."
              : periodo === "semana"
                ? "Nenhuma entrega nos próximos 7 dias."
                : "Nenhuma entrega pendente."}
          </p>
        )}

        {grupos.map((g) => (
          <div key={g.dia} className="secao">
            <div className="secao-cabecalho">
              <h2>{tituloDia(g.dia, hoje)}</h2>
              <span>{g.itens.length}</span>
            </div>
            <ul className="grupo" aria-busy={carregando}>
              {g.itens.map((o) => (
                <li key={o.id}>
                  <a className="linha" href={`#/orcamento/${o.id}`}>
                    <Selo horario={o.horarioEntrega} />
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
          </div>
        ))}
      </div>
    </section>
  );
}
