-- Valores em reais. Orçamentos anteriores ficam com 0,00 até serem editados.
ALTER TABLE servico ADD COLUMN valor NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (valor >= 0);
ALTER TABLE peca ADD COLUMN valor_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (valor_unitario >= 0);
