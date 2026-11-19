package br.com.lojabike.orcamentos.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "peca")
public class Peca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "orcamento_id")
    private Orcamento orcamento;

    @Column(name = "nome_peca", nullable = false, length = 150)
    private String nomePeca;

    @Column(nullable = false)
    private int quantidade;

    @Column(name = "valor_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorUnitario;

    protected Peca() {
    }

    public Peca(String nomePeca, int quantidade, BigDecimal valorUnitario) {
        this.nomePeca = nomePeca;
        this.quantidade = quantidade;
        this.valorUnitario = valorUnitario;
    }

    public Long getId() {
        return id;
    }

    public String getNomePeca() {
        return nomePeca;
    }

    public int getQuantidade() {
        return quantidade;
    }

    public BigDecimal getValorUnitario() {
        return valorUnitario;
    }

    /** Valor unitário vezes a quantidade. */
    public BigDecimal getSubtotal() {
        return valorUnitario.multiply(BigDecimal.valueOf(quantidade));
    }

    void setOrcamento(Orcamento orcamento) {
        this.orcamento = orcamento;
    }
}
