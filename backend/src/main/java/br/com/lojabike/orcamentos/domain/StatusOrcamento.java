package br.com.lojabike.orcamentos.domain;

public enum StatusOrcamento {
    ABERTO,
    APROVADO,
    EM_EXECUCAO,
    PRONTO,
    ENTREGUE,
    CANCELADO;

    /** Orçamentos nesses status não aceitam mais edição. */
    public boolean bloqueiaEdicao() {
        return this == ENTREGUE || this == CANCELADO;
    }
}
