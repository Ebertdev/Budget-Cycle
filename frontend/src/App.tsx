import { useEffect, useState } from "react";
import { IcAjustes, IcEntregas, IcOrcamentos } from "./componentes/Icones";
import { Marca } from "./componentes/Marca";
import Ajustes from "./paginas/Ajustes";
import Detalhe from "./paginas/Detalhe";
import Entregas from "./paginas/Entregas";
import Formulario from "./paginas/Formulario";
import Lista from "./paginas/Lista";
import { useRota, type Rota } from "./rota";

const ABAS = [
  { id: "orcamentos", href: "#/", rotulo: "Orçamentos", Icone: IcOrcamentos },
  { id: "entregas", href: "#/entregas", rotulo: "Entregas", Icone: IcEntregas },
  { id: "ajustes", href: "#/ajustes", rotulo: "Ajustes", Icone: IcAjustes },
] as const;

function abaAtiva(rota: Rota): string {
  if (rota.nome === "entregas") return "entregas";
  if (rota.nome === "ajustes") return "ajustes";
  return "orcamentos";
}

export default function App() {
  const rota = useRota();
  const online = useOnline();
  const ativa = abaAtiva(rota);

  return (
    <div className="app">
      <nav className="abas" aria-label="Seções">
        <div className="abas-marca">
          <Marca />
        </div>
        {ABAS.map(({ id, href, rotulo, Icone }) => (
          <a key={id} href={href} className="aba" aria-current={ativa === id ? "page" : undefined}>
            <Icone tamanho={26} />
            <span>{rotulo}</span>
          </a>
        ))}
      </nav>

      <main className="conteudo">
        {!online && (
          <p className="aviso-offline" role="status">
            Você está sem internet. Mostrando os últimos orçamentos consultados; salvar e excluir só
            funcionam com conexão.
          </p>
        )}
        {(rota.nome === "lista" || rota.nome === "novo") && <Lista />}
        {rota.nome === "entregas" && <Entregas />}
        {rota.nome === "ajustes" && <Ajustes />}
        {rota.nome === "detalhe" && <Detalhe key={rota.id} id={rota.id} />}
        {rota.nome === "editar" && <Detalhe key={`fundo-${rota.id}`} id={rota.id} />}
        {rota.nome === "novo" && <Formulario key="novo" />}
        {rota.nome === "editar" && <Formulario key={`editar-${rota.id}`} id={rota.id} />}
        {rota.nome === "inexistente" && (
          <section>
            <h1 className="titulo-grande">Página não encontrada</h1>
            <p>
              <a className="botao" href="#/">
                Voltar para os orçamentos
              </a>
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const ligar = () => setOnline(true);
    const desligar = () => setOnline(false);
    window.addEventListener("online", ligar);
    window.addEventListener("offline", desligar);
    return () => {
      window.removeEventListener("online", ligar);
      window.removeEventListener("offline", desligar);
    };
  }, []);
  return online;
}
