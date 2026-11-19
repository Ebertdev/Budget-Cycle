import { useCallback, useState } from "react";

export const HORARIOS_PADRAO = ["09:00", "10:30", "14:00", "15:30"];
export type Tema = "auto" | "claro" | "escuro";

const CHAVE_HORARIOS = "bc-horarios";
const CHAVE_TEMA = "bc-tema";

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* preferência é só uma conveniência */
  }
}

export function ordenarHorarios(lista: string[]): string[] {
  return [...new Set(lista)].sort();
}

export function lerHorarios(): string[] {
  const bruto = ler(CHAVE_HORARIOS);
  if (!bruto) return HORARIOS_PADRAO;
  try {
    const lista = JSON.parse(bruto);
    if (Array.isArray(lista) && lista.every((h) => typeof h === "string" && /^\d{2}:\d{2}$/.test(h))) {
      return ordenarHorarios(lista);
    }
  } catch {
    /* cai no padrão */
  }
  return HORARIOS_PADRAO;
}

export function useHorarios(): [string[], (lista: string[]) => void] {
  const [horarios, setHorarios] = useState(lerHorarios);
  const definir = useCallback((lista: string[]) => {
    const ordenada = ordenarHorarios(lista);
    setHorarios(ordenada);
    gravar(CHAVE_HORARIOS, JSON.stringify(ordenada));
  }, []);
  return [horarios, definir];
}

export function lerTema(): Tema {
  const t = ler(CHAVE_TEMA);
  return t === "claro" || t === "escuro" ? t : "auto";
}

export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === "auto") raiz.removeAttribute("data-tema");
  else raiz.setAttribute("data-tema", tema);
}

export function salvarTema(tema: Tema) {
  gravar(CHAVE_TEMA, tema);
  aplicarTema(tema);
}
