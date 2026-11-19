import { useState } from "react";
import { lerTema, salvarTema, useHorarios, HORARIOS_PADRAO, type Tema } from "../preferencias";

const TEMAS: { id: Tema; rotulo: string }[] = [
  { id: "auto", rotulo: "Automático" },
  { id: "claro", rotulo: "Claro" },
  { id: "escuro", rotulo: "Escuro" },
];

export default function Ajustes() {
  const [tema, setTema] = useState<Tema>(lerTema);
  const [horarios, definirHorarios] = useHorarios();
  const [novo, setNovo] = useState("");

  function escolherTema(t: Tema) {
    setTema(t);
    salvarTema(t);
  }

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!novo || horarios.includes(novo)) {
      setNovo("");
      return;
    }
    definirHorarios([...horarios, novo]);
    setNovo("");
  }

  return (
    <section>
      <h1 className="titulo-grande">Ajustes</h1>

      <div className="secao">
        <div className="secao-cabecalho">
          <h2 id="rotulo-tema">Aparência</h2>
        </div>
        <div role="radiogroup" aria-labelledby="rotulo-tema" className="segmentado">
          {TEMAS.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={tema === t.id}
              onClick={() => escolherTema(t.id)}
            >
              {t.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="secao">
        <div className="secao-cabecalho">
          <h2>Horários de entrega</h2>
        </div>
        <p className="nota">Aparecem como atalhos ao registrar um orçamento. “Outro” sempre fica disponível.</p>
        <ul className="grupo">
          {horarios.map((h) => (
            <li key={h} className="linha-simples">
              <span className="hora-lista">{h}</span>
              <button
                className="botao-texto perigo"
                onClick={() => definirHorarios(horarios.filter((x) => x !== h))}
                aria-label={`Remover o horário ${h}`}
              >
                Remover
              </button>
            </li>
          ))}
          {horarios.length === 0 && <li className="linha-simples nota">Nenhum atalho. Só “Outro” será exibido.</li>}
        </ul>
        <form className="adicionar" onSubmit={adicionar}>
          <label className="campo-inline">
            <span>Novo horário</span>
            <input type="time" value={novo} onChange={(e) => setNovo(e.target.value)} />
          </label>
          <button type="submit" className="botao" disabled={!novo}>
            Adicionar
          </button>
        </form>
        <button className="botao-texto" onClick={() => definirHorarios(HORARIOS_PADRAO)}>
          Restaurar horários padrão
        </button>
      </div>

      <div className="secao">
        <div className="secao-cabecalho">
          <h2>Sobre</h2>
        </div>
        <ul className="grupo">
          <li className="linha-simples">
            <span>Budgetcycle</span>
            <span className="nota">Bicicloed · versão 0.2</span>
          </li>
          <li className="linha-simples">
            <span>Telefones</span>
            <span className="nota">Brasil (+55)</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
