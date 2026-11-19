-- Data em que o orçamento foi feito (dia civil na loja, independente do fuso do servidor).
ALTER TABLE orcamento ADD COLUMN data_orcamento DATE;
UPDATE orcamento SET data_orcamento = CAST(criado_em AS DATE);
ALTER TABLE orcamento ALTER COLUMN data_orcamento SET NOT NULL;
