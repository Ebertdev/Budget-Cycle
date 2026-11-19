import type { ReactNode } from "react";

function Icone({ children, tamanho = 24 }: { children: ReactNode; tamanho?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

type P = { tamanho?: number };

export const IcOrcamentos = (p: P) => (
  <Icone {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
  </Icone>
);
export const IcEntregas = (p: P) => (
  <Icone {...p}>
    <path d="M20 11V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h5M8 3v4M16 3v4M4 10h16" />
    <circle cx="17" cy="17" r="4" />
    <path d="M17 15.2V17l1.2 1" />
  </Icone>
);
export const IcAjustes = (p: P) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Icone>
);
export const IcMais = (p: P) => (
  <Icone {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icone>
);
export const IcChevron = (p: P) => (
  <Icone {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icone>
);
export const IcVoltar = (p: P) => (
  <Icone {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Icone>
);
export const IcCheck = (p: P) => (
  <Icone {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icone>
);
export const IcBusca = (p: P) => (
  <Icone {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Icone>
);
export const IcFone = (p: P) => (
  <Icone {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </Icone>
);
export const IcMensagem = (p: P) => (
  <Icone {...p}>
    <path d="M4 20l1.3-4.2A8 8 0 1 1 8.2 18.8L4 20z" />
  </Icone>
);

// Ícones de status (cor + ícone + texto)
export const IcAberto = (p: P) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="8" />
  </Icone>
);
export const IcAprovado = (p: P) => (
  <Icone {...p}>
    <path d="M7 11v9H4v-9h3zM7 12l4-8a2 2 0 0 1 2 2.4L12.5 10H19a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 18 20H7" />
  </Icone>
);
export const IcExecucao = (p: P) => (
  <Icone {...p}>
    <path d="M14.5 6.5a4 4 0 0 0 4.9 4.9l-9.4 9.4a2.1 2.1 0 0 1-3-3l9.4-9.4A4 4 0 0 0 14.5 6.5z" />
  </Icone>
);
export const IcPronto = (p: P) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 12.3l2.5 2.5 4.5-5" />
  </Icone>
);
export const IcEntregue = (p: P) => (
  <Icone {...p}>
    <path d="M2.5 12.5l4 4L14 8M10 15.5l1 1L20 7.5" />
  </Icone>
);
export const IcCancelado = (p: P) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </Icone>
);
