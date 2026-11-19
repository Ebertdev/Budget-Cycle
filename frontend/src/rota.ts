import { useEffect, useState } from "react";

export type Rota =
  | { nome: "lista" }
  | { nome: "entregas" }
  | { nome: "ajustes" }
  | { nome: "novo" }
  | { nome: "detalhe"; id: number }
  | { nome: "editar"; id: number }
  | { nome: "inexistente" };

export function lerRota(hash: string): Rota {
  const caminho = hash.replace(/^#/, "").replace(/\/+$/, "");
  if (caminho === "" || caminho === "/") return { nome: "lista" };
  if (caminho === "/entregas") return { nome: "entregas" };
  if (caminho === "/ajustes") return { nome: "ajustes" };
  if (caminho === "/novo") return { nome: "novo" };
  const m = caminho.match(/^\/orcamento\/(\d+)(\/editar)?$/);
  if (m) return m[2] ? { nome: "editar", id: Number(m[1]) } : { nome: "detalhe", id: Number(m[1]) };
  return { nome: "inexistente" };
}

export function useRota(): Rota {
  const [rota, setRota] = useState<Rota>(() => lerRota(window.location.hash));
  useEffect(() => {
    const aoMudar = () => {
      setRota(lerRota(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", aoMudar);
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);
  return rota;
}

export function irPara(caminho: string) {
  window.location.hash = caminho;
}
