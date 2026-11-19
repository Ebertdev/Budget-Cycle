import { useEffect, useRef, useState } from "react";
import { ApiError, buscarOrcamento, excluirOrcamento, mudarStatus } from "../api";
import { formatarReais, reaisParaCentavos } from "../dinheiro";
import { IcFone, IcMensagem, IcVoltar } from "../componentes/Icones";
import { gerarPdf, nomeArquivo, textoOrcamento } from "../exportar";
import StatusChip from "../componentes/StatusChip";
import {
  EDICAO_BLOQUEADA,
  formatarData,
  formatarHorario,
  telefoneInternacional,
} from "../formato";
import { irPara } from "../rota";
import type { Orcamento, Status } from "../tipos";
import { formatarTelefone } from "../validacao";

export const CHAVE_AVISOS = "avisos-orcamento";

function lerAvisosGuardados(id: number): string[] {
  try {
    const bruto = sessionStorage.getItem(CHAVE_AVISOS);
    if (!bruto) return [];
    sessionStorage.removeItem(CHAVE_AVISOS);
    const guardado = JSON.parse(bruto) as { id: number; avisos: string[] };
    return guardado.id === id ? guardado.avisos : [];
  } catch {
    return [];
  }
}

/** Próximo passo natural do orçamento, com o texto do botão que o executa. */
const PROXIMO: Partial<Record<Status, { status: Status; rotulo: string }>> = {
  ABERTO: { status: "EM_EXECUCAO", rotulo: "Iniciar execução" },
  APROVADO: { status: "EM_EXECUCAO", rotulo: "Iniciar execução" },
  EM_EXECUCAO: { status: "PRONTO", rotulo: "Marcar como pronto" },
  PRONTO: { status: "ENTREGUE", rotulo: "Registrar entrega" },
};

type Confirmacao = "excluir" | "cancelar";

export default function Detalhe({ id }: { id: number }) {
  const [orcamento, setOrcamento] = useState<Orcamento>();
  const [erro, setErro] = useState<string>();
  const [avisos] = useState(() => lerAvisosGuardados(id));
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState<Confirmacao>();
  const dialogo = useRef<HTMLDialogElement>(null);
  const dialogoExportar = useRef<HTMLDialogElement>(null);
  const [exportando, setExportando] = useState(false);
  const [retornoExportar, setRetornoExportar] = useState<{ texto: string; erro?: boolean }>();

  useEffect(() => {
    let cancelado = false;
    buscarOrcamento(id)
      .then((o) => !cancelado && setOrcamento(o))
      .catch((e: unknown) => {
        if (cancelado) return;
        setErro(e instanceof ApiError ? e.message : "Não foi possível carregar o orçamento");
      });
    return () => {
      cancelado = true;
    };
  }, [id]);

  function pedirConfirmacao(tipo: Confirmacao) {
    setConfirmar(tipo);
    dialogo.current?.showModal();
  }

  async function exportar(modo: "baixar" | "compartilhar" | "copiar") {
    if (!orcamento) return;
    setExportando(true);
    setRetornoExportar(undefined);
    try {
      if (modo === "copiar") {
        await navigator.clipboard.writeText(textoOrcamento(orcamento));
        setRetornoExportar({ texto: "Texto copiado. É só colar na conversa." });
        return;
      }
      const pdf = await gerarPdf(orcamento);
      const nome = nomeArquivo(orcamento);
      if (modo === "compartilhar") {
        await navigator.share({ files: [new File([pdf], nome, { type: "application/pdf" })] });
        return;
      }
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = nome;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setRetornoExportar({ texto: "PDF gerado. Confira em Downloads." });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return; // a pessoa fechou o compartilhamento
      setRetornoExportar({ texto: "Não foi possível exportar. Tente de novo.", erro: true });
    } finally {
      setExportando(false);
    }
  }

  function abrirExportar() {
    setRetornoExportar(undefined);
    dialogoExportar.current?.showModal();
  }

  async function avancar(status: Status) {
    setOcupado(true);
    setErro(undefined);
    try {
      setOrcamento(await mudarStatus(id, status));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível mudar o status");
    } finally {
      setOcupado(false);
      dialogo.current?.close();
    }
  }

  async function excluir() {
    setOcupado(true);
    try {
      await excluirOrcamento(id);
      irPara("/");
    } catch (e) {
      dialogo.current?.close();
      setErro(e instanceof ApiError ? e.message : "Não foi possível excluir o orçamento");
      setOcupado(false);
    }
  }

  if (erro && !orcamento) {
    return (
      <section>
        <p className="mensagem erro-geral" role="alert">
          {erro}
        </p>
        <a className="botao" href="#/">
          Voltar para a lista
        </a>
      </section>
    );
  }
  if (!orcamento) return <p className="vazio">Carregando orçamento…</p>;

  const bloqueado = EDICAO_BLOQUEADA.includes(orcamento.status);
  const proximo = PROXIMO[orcamento.status];
  const digitos = telefoneInternacional(orcamento.telefone);

  return (
    <section>
      <div className="barra-titulo">
        <a className="voltar" href="#/">
          <IcVoltar tamanho={20} />
          Orçamentos
        </a>
        <span className="barra-acoes">
          <button className="botao-texto" onClick={abrirExportar}>
            Exportar
          </button>
          {!bloqueado && (
            <a className="botao-texto" href={`#/orcamento/${orcamento.id}/editar`}>
              Editar
            </a>
          )}
        </span>
      </div>

      {avisos.map((a) => (
        <p key={a} className="mensagem aviso" role="status">
          {a}
        </p>
      ))}
      {erro && (
        <p className="mensagem erro-geral" role="alert">
          {erro}
        </p>
      )}

      <h1 className="titulo-grande">{orcamento.nomeCliente}</h1>
      <div className="detalhe-status">
        <StatusChip status={orcamento.status} />
      </div>

      <p className="nota feito-em">Orçamento feito em {formatarData(orcamento.dataOrcamento)}</p>

      <div className="entrega">
        <span className="entrega-rotulo">Entrega</span>
        <span className="entrega-valor">
          {formatarData(orcamento.dataEntrega)} às{" "}
          <span className="entrega-hora">{formatarHorario(orcamento.horarioEntrega)}</span>
        </span>
      </div>

      <div className="contato">
        <a className="botao" href={`tel:+${digitos}`}>
          <IcFone tamanho={20} /> Ligar
        </a>
        <a className="botao" href={`https://wa.me/${digitos}`} target="_blank" rel="noopener noreferrer">
          <IcMensagem tamanho={20} /> WhatsApp
          <span className="so-leitor"> (abre em nova aba)</span>
        </a>
      </div>

      <div className="secao">
        <div className="secao-cabecalho">
          <h2>Cliente</h2>
        </div>
        <dl className="grupo dados">
          <div className="linha-simples">
            <dt>Telefone</dt>
            <dd>{formatarTelefone(orcamento.telefone)}</dd>
          </div>
        </dl>
      </div>

      <div className="secao">
        <div className="secao-cabecalho">
          <h2>Serviços</h2>
        </div>
        <ul className="grupo">
          {orcamento.servicos.map((s) => (
            <li key={s.id} className="linha-simples">
              <span>{s.descricao}</span>
              <span className="valor-linha">{formatarReais(reaisParaCentavos(s.valor))}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="secao">
        <div className="secao-cabecalho">
          <h2>Peças trocadas</h2>
        </div>
        {orcamento.pecas.length === 0 ? (
          <p className="nota">Nenhuma peça trocada neste orçamento.</p>
        ) : (
          <ul className="grupo">
            {orcamento.pecas.map((p) => (
              <li key={p.id} className="linha-simples">
                <span className="peca-nome">
                  {p.nomePeca}
                  <span className="nota">
                    {p.quantidade}× {formatarReais(reaisParaCentavos(p.valorUnitario))}
                  </span>
                </span>
                <span className="valor-linha">{formatarReais(reaisParaCentavos(p.subtotal))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="total">
        <span>Valor total</span>
        <strong>{formatarReais(reaisParaCentavos(orcamento.valorTotal))}</strong>
      </div>

      {orcamento.observacoes && (
        <div className="secao">
          <div className="secao-cabecalho">
            <h2>Observações</h2>
          </div>
          <p className="grupo texto-livre">{orcamento.observacoes}</p>
        </div>
      )}

      <div className="acoes">
        {proximo && (
          <button className="botao primario" disabled={ocupado} onClick={() => avancar(proximo.status)}>
            {proximo.rotulo}
          </button>
        )}
        {bloqueado && (
          <p className="nota">
            Orçamento {orcamento.status === "ENTREGUE" ? "entregue" : "cancelado"}: não pode mais ser
            editado.
          </p>
        )}
        {!bloqueado && (
          <button className="botao perigo" disabled={ocupado} onClick={() => pedirConfirmacao("cancelar")}>
            Cancelar orçamento
          </button>
        )}
        <button className="botao perigo" disabled={ocupado} onClick={() => pedirConfirmacao("excluir")}>
          Excluir orçamento
        </button>
      </div>

      <dialog
        ref={dialogoExportar}
        className="dialogo"
        aria-labelledby="titulo-exportar"
      >
        <h2 id="titulo-exportar">Exportar orçamento</h2>
        <p>Envie ao cliente ou guarde uma cópia.</p>
        <div className="acoes-dialogo">
          <button className="botao" disabled={exportando} onClick={() => exportar("baixar")} autoFocus>
            Baixar PDF
          </button>
          {typeof navigator.share === "function" && (
            <button className="botao" disabled={exportando} onClick={() => exportar("compartilhar")}>
              Compartilhar PDF
            </button>
          )}
          <button className="botao" disabled={exportando} onClick={() => exportar("copiar")}>
            Copiar como texto
          </button>
          <button className="botao-texto" onClick={() => dialogoExportar.current?.close()}>
            Fechar
          </button>
        </div>
        <p
          className={retornoExportar?.erro ? "mensagem erro-geral" : "nota"}
          role={retornoExportar?.erro ? "alert" : "status"}
        >
          {retornoExportar?.texto}
        </p>
      </dialog>

      <dialog
        ref={dialogo}
        className="dialogo"
        aria-labelledby="titulo-confirmacao"
        onClose={() => setConfirmar(undefined)}
      >
        <h2 id="titulo-confirmacao">
          {confirmar === "cancelar"
            ? `Cancelar o orçamento de ${orcamento.nomeCliente}?`
            : `Excluir o orçamento de ${orcamento.nomeCliente}?`}
        </h2>
        <p>
          {confirmar === "cancelar"
            ? "Ele sai da lista de entregas e não poderá mais ser editado."
            : "Essa ação não pode ser desfeita."}
        </p>
        <div className="acoes-dialogo">
          <button className="botao" onClick={() => dialogo.current?.close()} autoFocus>
            Voltar
          </button>
          <button
            className="botao perigo cheio"
            disabled={ocupado}
            onClick={() => (confirmar === "cancelar" ? avancar("CANCELADO") : excluir())}
          >
            {confirmar === "cancelar" ? "Cancelar orçamento" : "Excluir"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
