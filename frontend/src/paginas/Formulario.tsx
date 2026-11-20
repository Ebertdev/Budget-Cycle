import { useEffect, useRef, useState, type ReactNode } from "react";
import { ApiError, atualizarOrcamento, buscarOrcamento, criarOrcamento } from "../api";
import { IcCheck } from "../componentes/Icones";
import { centavosParaTexto, formatarReais, paraCentavos, reaisParaCentavos, totalEmCentavos } from "../dinheiro";
import { dataISO, diaCurto, somarDias, SERVICOS_FREQUENTES } from "../formato";
import { useHorarios } from "../preferencias";
import { irPara } from "../rota";
import type { Orcamento } from "../tipos";
import {
  formatarTelefone,
  hojeISO,
  limparForm,
  soDigitos,
  validarOrcamento,
  type Erros,
  type FormOrcamento,
} from "../validacao";
import { CHAVE_AVISOS } from "./Detalhe";

const FORM_VAZIO: FormOrcamento = {
  nomeCliente: "",
  telefone: "",
  dataEntrega: "",
  horarioEntrega: "",
  observacoes: "",
  servicos: [],
  pecas: [],
};

function deOrcamento(o: Orcamento): FormOrcamento {
  return {
    nomeCliente: o.nomeCliente,
    telefone: formatarTelefone(o.telefone),
    dataEntrega: o.dataEntrega,
    horarioEntrega: o.horarioEntrega.slice(0, 5),
    observacoes: o.observacoes ?? "",
    servicos: o.servicos.map((s) => ({
      descricao: s.descricao,
      valor: centavosParaTexto(reaisParaCentavos(s.valor)),
    })),
    pecas: o.pecas.map((p) => ({
      nomePeca: p.nomePeca,
      quantidade: String(p.quantidade),
      valorUnitario: centavosParaTexto(reaisParaCentavos(p.valorUnitario)),
    })),
  };
}

function Secao(props: { titulo: string; erro?: string; children: ReactNode }) {
  return (
    <div className="secao">
      <div className="secao-cabecalho">
        <h2>{props.titulo}</h2>
      </div>
      {props.children}
      {props.erro && (
        <p className="erro" role="alert">
          {props.erro}
        </p>
      )}
    </div>
  );
}

function LinhaCampo(props: { rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <label className={`linha-campo${props.erro ? " com-erro" : ""}`}>
      <span className="linha-campo-rotulo">{props.rotulo}</span>
      {props.children}
      {props.erro && (
        <small className="erro" role="alert">
          {props.erro}
        </small>
      )}
    </label>
  );
}

function CampoValor(props: {
  rotulo: string;
  rotuloAcessivel: string;
  valor: string;
  erro?: string;
  onChange: (valor: string) => void;
}) {
  return (
    <label className={`linha-campo valor${props.erro ? " com-erro" : ""}`}>
      <span className="linha-campo-rotulo">{props.rotulo}</span>
      <span className="prefixo-moeda" aria-hidden="true">
        R$
      </span>
      <input
        inputMode="decimal"
        autoComplete="off"
        value={props.valor}
        placeholder="0,00"
        aria-label={props.rotuloAcessivel}
        aria-invalid={!!props.erro}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={() => {
          const c = paraCentavos(props.valor);
          if (c !== null) props.onChange(centavosParaTexto(c)); // 35,5 vira 35,50
        }}
      />
      {props.erro && (
        <small className="erro" role="alert">
          {props.erro}
        </small>
      )}
    </label>
  );
}

function subtotalPeca(p: { quantidade: string; valorUnitario: string }): number {
  return totalEmCentavos({ servicos: [], pecas: [p] });
}

function Chip(props: { ativo: boolean; onClick: () => void; children: ReactNode; extra?: boolean }) {
  return (
    <button
      type="button"
      className={`chip${props.ativo ? " ativo" : ""}${props.extra ? " extra" : ""}`}
      aria-pressed={props.ativo}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export default function Formulario({ id }: { id?: number }) {
  const editando = id !== undefined;
  const voltar = editando ? `/orcamento/${id}` : "/";
  const [form, setForm] = useState<FormOrcamento>(FORM_VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [outraData, setOutraData] = useState(false);
  const [outroHorario, setOutroHorario] = useState(false);
  const [trocouPeca, setTrocouPeca] = useState(false);
  const [novoServico, setNovoServico] = useState("");
  const [horarios] = useHorarios();
  const refDialogo = useRef<HTMLDialogElement>(null);
  const refForm = useRef<HTMLFormElement>(null);

  const hoje = dataISO(new Date());
  const diasRapidos = [hoje, somarDias(hoje, 1), somarDias(hoje, 2)];
  const rotuloDia = (i: number) => (i === 0 ? "Hoje" : i === 1 ? `Amanhã, ${diaCurto(diasRapidos[1])}` : diaCurto(diasRapidos[2]));

  useEffect(() => {
    const d = refDialogo.current;
    if (d && !d.open) d.showModal();
  }, [carregando]);

  useEffect(() => {
    if (id === undefined) return;
    let cancelado = false;
    buscarOrcamento(id)
      .then((o) => {
        if (cancelado) return;
        const f = deOrcamento(o);
        setForm(f);
        setTrocouPeca(f.pecas.length > 0);
        setOutraData(!diasRapidos.includes(f.dataEntrega));
        setOutroHorario(!horarios.includes(f.horarioEntrega));
        setCarregando(false);
      })
      .catch((e: unknown) => {
        if (cancelado) return;
        setErroGeral(e instanceof ApiError ? e.message : "Não foi possível carregar o orçamento");
        setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function atualizar<K extends keyof FormOrcamento>(campo: K, valor: FormOrcamento[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  /** Valida um campo quando a pessoa sai dele, sem mostrar erro de campos ainda não visitados. */
  function validarAoSair(campo: keyof FormOrcamento) {
    const todos = validarOrcamento(limparForm(form));
    setErros((atual) => {
      const proximo = { ...atual };
      if (todos[campo]) proximo[campo] = todos[campo];
      else delete proximo[campo];
      return proximo;
    });
  }

  function focarPrimeiroErro() {
    requestAnimationFrame(() => {
      const alvo = refForm.current?.querySelector<HTMLElement>(
        ".com-erro input, .com-erro textarea, .secao .erro",
      );
      alvo?.focus?.();
      alvo?.scrollIntoView?.({ block: "center" });
    });
  }

  const selecionados = form.servicos.map((s) => s.descricao);
  const total = totalEmCentavos({ servicos: form.servicos, pecas: trocouPeca ? form.pecas : [] });
  const personalizados = selecionados.filter((s) => !SERVICOS_FREQUENTES.includes(s));

  function alternarServico(descricao: string) {
    atualizar(
      "servicos",
      selecionados.includes(descricao)
        ? form.servicos.filter((s) => s.descricao !== descricao)
        : [...form.servicos, { descricao, valor: "" }],
    );
  }

  function alterarValorServico(descricao: string, valor: string) {
    atualizar(
      "servicos",
      form.servicos.map((s) => (s.descricao === descricao ? { ...s, valor } : s)),
    );
  }

  function adicionarPersonalizado() {
    const texto = novoServico.trim();
    if (!texto) return;
    if (!selecionados.includes(texto)) atualizar("servicos", [...form.servicos, { descricao: texto, valor: "" }]);
    setNovoServico("");
  }

  function escolherDia(iso: string) {
    setOutraData(false);
    atualizar("dataEntrega", iso);
    setErros((e) => {
      const { dataEntrega: _, ...resto } = e;
      return resto;
    });
  }

  function escolherHorario(h: string) {
    setOutroHorario(false);
    atualizar("horarioEntrega", h);
    setErros((e) => {
      const { horarioEntrega: _, ...resto } = e;
      return resto;
    });
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    setErroGeral(undefined);
    const pendente = novoServico.trim();
    const comPendente = pendente && !selecionados.includes(pendente)
      ? { ...form, servicos: [...form.servicos, { descricao: pendente, valor: "" }] }
      : form;
    // Com a opção ligada, linhas de peça em branco não são descartadas: viram erro no campo,
    // em vez de salvar o orçamento sem a peça que a pessoa achou que tinha adicionado.
    const limpo = {
      ...limparForm({ ...comPendente, pecas: [] }),
      pecas: trocouPeca
        ? comPendente.pecas.map((p) => ({
            nomePeca: p.nomePeca.trim(),
            quantidade: p.quantidade,
            valorUnitario: p.valorUnitario.trim(),
          }))
        : [],
    };
    setForm((f) => ({ ...f, servicos: limpo.servicos }));
    setNovoServico("");
    const encontrados = validarOrcamento(limpo);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      focarPrimeiroErro();
      return;
    }

    const dados = {
      nomeCliente: limpo.nomeCliente,
      telefone: soDigitos(limpo.telefone),
      dataEntrega: limpo.dataEntrega,
      horarioEntrega: limpo.horarioEntrega,
      observacoes: limpo.observacoes,
      servicos: limpo.servicos.map((s) => ({
        descricao: s.descricao,
        valor: (paraCentavos(s.valor) ?? 0) / 100,
      })),
      pecas: limpo.pecas.map((p) => ({
        nomePeca: p.nomePeca,
        quantidade: Number(p.quantidade),
        valorUnitario: (paraCentavos(p.valorUnitario) ?? 0) / 100,
      })),
    };

    setSalvando(true);
    try {
      const salvo = editando ? await atualizarOrcamento(id, dados) : await criarOrcamento(dados);
      try {
        if (salvo.avisos.length > 0) {
          sessionStorage.setItem(CHAVE_AVISOS, JSON.stringify({ id: salvo.id, avisos: salvo.avisos }));
        }
      } catch {
        /* aviso é opcional */
      }
      setConcluido(true);
      const reduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => irPara(`/orcamento/${salvo.id}`), reduzido ? 0 : 750);
    } catch (err) {
      if (err instanceof ApiError && err.campos.length > 0) {
        const doServidor: Erros = {};
        err.campos.forEach((c) => {
          doServidor[c.campo.replace(/\[(\d+)\]/g, ".$1")] = c.mensagem;
        });
        setErros(doServidor);
        focarPrimeiroErro();
      } else {
        setErroGeral(err instanceof ApiError ? err.message : "Não foi possível salvar o orçamento");
      }
      setSalvando(false);
    }
  }

  const titulo = editando ? "Editar orçamento" : "Novo orçamento";

  return (
    <dialog
      ref={refDialogo}
      className="folha"
      aria-labelledby="titulo-folha"
      onCancel={(e) => {
        e.preventDefault();
        irPara(voltar);
      }}
    >
      <header className="folha-topo">
        <button type="button" className="botao-texto" onClick={() => irPara(voltar)}>
          Cancelar
        </button>
        <h1 id="titulo-folha">{titulo}</h1>
        <button type="submit" form="form-orcamento" className="botao-texto forte" disabled={salvando || carregando}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </header>

      <div className="folha-corpo">
        {carregando ? (
          <p className="vazio">Carregando orçamento…</p>
        ) : (
          <form id="form-orcamento" ref={refForm} onSubmit={salvar} noValidate>
            {erroGeral && (
              <p className="mensagem erro-geral" role="alert">
                {erroGeral}
              </p>
            )}

            <Secao titulo="Cliente">
              <div className="grupo">
                <LinhaCampo rotulo="Nome" erro={erros.nomeCliente}>
                  <input
                    value={form.nomeCliente}
                    onChange={(e) => atualizar("nomeCliente", e.target.value)}
                    onBlur={() => validarAoSair("nomeCliente")}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Maria Souza"
                    aria-invalid={!!erros.nomeCliente}
                  />
                </LinhaCampo>
                <LinhaCampo rotulo="Telefone" erro={erros.telefone}>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={form.telefone}
                    onChange={(e) => atualizar("telefone", formatarTelefone(e.target.value))}
                    onBlur={() => validarAoSair("telefone")}
                    autoComplete="tel-national"
                    placeholder="(71) 99999-0000"
                    aria-invalid={!!erros.telefone}
                  />
                </LinhaCampo>
              </div>
            </Secao>

            <Secao titulo="Entrega" erro={erros.dataEntrega ?? erros.horarioEntrega}>
              <div className="grupo grupo-chips">
                <div className="chips" role="group" aria-label="Dia da entrega">
                  {diasRapidos.map((iso, i) => (
                    <Chip
                      key={iso}
                      ativo={!outraData && form.dataEntrega === iso}
                      onClick={() => escolherDia(iso)}
                    >
                      {rotuloDia(i)}
                    </Chip>
                  ))}
                  <Chip extra ativo={outraData} onClick={() => setOutraData(true)}>
                    Outra
                  </Chip>
                </div>
                {outraData && (
                  <label className="linha-campo">
                    <span className="linha-campo-rotulo">Data</span>
                    <input
                      type="date"
                      min={hojeISO()}
                      value={form.dataEntrega}
                      onChange={(e) => atualizar("dataEntrega", e.target.value)}
                      onBlur={() => validarAoSair("dataEntrega")}
                      aria-invalid={!!erros.dataEntrega}
                    />
                  </label>
                )}
              </div>
              <div className="grupo grupo-chips separado">
                <div className="chips" role="group" aria-label="Horário da entrega">
                  {horarios.map((h) => (
                    <Chip key={h} ativo={!outroHorario && form.horarioEntrega === h} onClick={() => escolherHorario(h)}>
                      {h}
                    </Chip>
                  ))}
                  <Chip extra ativo={outroHorario} onClick={() => setOutroHorario(true)}>
                    Outro
                  </Chip>
                </div>
                {outroHorario && (
                  <label className="linha-campo">
                    <span className="linha-campo-rotulo">Horário</span>
                    <input
                      type="time"
                      value={form.horarioEntrega}
                      onChange={(e) => atualizar("horarioEntrega", e.target.value)}
                      onBlur={() => validarAoSair("horarioEntrega")}
                      aria-invalid={!!erros.horarioEntrega}
                    />
                  </label>
                )}
              </div>
            </Secao>

            <Secao titulo="Serviços" erro={erros.servicos}>
              <ul className="grupo">
                {[...SERVICOS_FREQUENTES, ...personalizados].map((nome) => {
                  const marcado = selecionados.includes(nome);
                  const indice = selecionados.indexOf(nome);
                  const erroValor = erros[`servicos.${indice}.valor`];
                  return (
                    <li key={nome}>
                      <label className="linha-opcao">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => alternarServico(nome)}
                        />
                        <span>{nome}</span>
                        <IcCheck tamanho={20} />
                      </label>
                      {marcado && (
                        <CampoValor
                          rotulo="Valor"
                          rotuloAcessivel={`Valor de ${nome}`}
                          valor={form.servicos[indice].valor}
                          erro={erroValor}
                          onChange={(v) => alterarValorServico(nome, v)}
                        />
                      )}
                    </li>
                  );
                })}
                <li>
                  <div className="linha-campo">
                    <input
                      className="sozinho"
                      value={novoServico}
                      maxLength={200}
                      placeholder="Outro serviço"
                      aria-label="Outro serviço"
                      onChange={(e) => setNovoServico(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          adicionarPersonalizado();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="botao-texto"
                      disabled={!novoServico.trim()}
                      onClick={adicionarPersonalizado}
                    >
                      Adicionar
                    </button>
                  </div>
                </li>
              </ul>
            </Secao>

            <div className="secao">
              <div className="grupo">
                <label className="linha-opcao troca">
                  <span>Houve troca de peça?</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={trocouPeca}
                    onChange={(e) => {
                      setTrocouPeca(e.target.checked);
                      if (e.target.checked) {
                        if (form.pecas.length === 0) {
                          atualizar("pecas", [{ nomePeca: "", quantidade: "1", valorUnitario: "" }]);
                        }
                        // Leva a pessoa até o campo novo, que aparece abaixo do interruptor.
                        requestAnimationFrame(() => {
                          const campo = refForm.current?.querySelector<HTMLInputElement>(".linha-peca input");
                          campo?.focus?.();
                          campo?.scrollIntoView?.({ block: "center", behavior: "smooth" });
                        });
                      }
                    }}
                  />
                  <span className="interruptor" aria-hidden="true" />
                </label>
              </div>
            </div>

            {trocouPeca && (
              <Secao titulo="Peças trocadas">
                <ul className="grupo">
                  {form.pecas.map((p, i) => (
                    <li key={i} className="linha-peca">
                      <LinhaCampo rotulo={`Peça ${i + 1}`} erro={erros[`pecas.${i}.nomePeca`]}>
                        <input
                          value={p.nomePeca}
                          maxLength={150}
                          placeholder="Câmara de ar aro 29"
                          onChange={(e) =>
                            atualizar(
                              "pecas",
                              form.pecas.map((x, j) => (j === i ? { ...x, nomePeca: e.target.value } : x)),
                            )
                          }
                          aria-invalid={!!erros[`pecas.${i}.nomePeca`]}
                        />
                      </LinhaCampo>
                      <LinhaCampo rotulo="Quantidade" erro={erros[`pecas.${i}.quantidade`]}>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={p.quantidade}
                          onChange={(e) =>
                            atualizar(
                              "pecas",
                              form.pecas.map((x, j) => (j === i ? { ...x, quantidade: e.target.value } : x)),
                            )
                          }
                          aria-invalid={!!erros[`pecas.${i}.quantidade`]}
                        />
                      </LinhaCampo>
                      <CampoValor
                        rotulo="Valor unitário"
                        rotuloAcessivel={`Valor unitário da peça ${i + 1}`}
                        valor={p.valorUnitario}
                        erro={erros[`pecas.${i}.valorUnitario`]}
                        onChange={(v) =>
                          atualizar(
                            "pecas",
                            form.pecas.map((x, j) => (j === i ? { ...x, valorUnitario: v } : x)),
                          )
                        }
                      />
                      <p className="subtotal">Subtotal {formatarReais(subtotalPeca(p))}</p>
                      <button
                        type="button"
                        className="botao-texto perigo"
                        onClick={() =>
                          atualizar(
                            "pecas",
                            form.pecas.filter((_, j) => j !== i),
                          )
                        }
                        aria-label={`Remover peça ${i + 1}`}
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                  <li className="linha-simples">
                    <button
                      type="button"
                      className="botao-texto"
                      onClick={() => atualizar("pecas", [...form.pecas, { nomePeca: "", quantidade: "1", valorUnitario: "" }])}
                    >
                      Adicionar peça
                    </button>
                  </li>
                </ul>
              </Secao>
            )}

            <Secao titulo="Observações">
              <div className="grupo">
                <label className="linha-campo coluna">
                  <span className="so-leitor">Anotações para a oficina (opcional)</span>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    placeholder="Anotações para a oficina (opcional)"
                    value={form.observacoes}
                    onChange={(e) => atualizar("observacoes", e.target.value)}
                  />
                </label>
              </div>
            </Secao>
          </form>
        )}
      </div>

      {!carregando && (
        <div className="folha-total" aria-live="polite">
          <span>Total</span>
          <strong>{formatarReais(total)}</strong>
        </div>
      )}

      {concluido && (
        <div className="concluido" role="status">
          <svg viewBox="0 0 64 64" width="88" height="88" aria-hidden="true">
            <circle cx="32" cy="32" r="28" fill="var(--tint)" />
            <path d="M19 33l9 9 17-19" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="traco" />
          </svg>
          <p>{editando ? "Orçamento atualizado" : "Orçamento salvo"}</p>
        </div>
      )}
    </dialog>
  );
}