import "@fontsource/barlow-condensed/700.css";
import "./estilos.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { aplicarTema, lerTema } from "./preferencias";

aplicarTema(lerTema());

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
