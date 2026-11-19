package br.com.lojabike.orcamentos.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orcamento")
public class Orcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome_cliente", nullable = false, length = 100)
    private String nomeCliente;

    @Column(nullable = false, length = 11)
    private String telefone;

    @Column(name = "data_entrega", nullable = false)
    private LocalDate dataEntrega;

    @Column(name = "horario_entrega", nullable = false)
    private LocalTime horarioEntrega;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusOrcamento status = StatusOrcamento.ABERTO;

    @Column(length = 1000)
    private String observacoes;

    @Column(name = "data_orcamento", nullable = false)
    private LocalDate dataOrcamento;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<Servico> servicos = new ArrayList<>();

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<Peca> pecas = new ArrayList<>();

    @PrePersist
    void aoCriar() {
        LocalDateTime agora = LocalDateTime.now();
        criadoEm = agora;
        atualizadoEm = agora;
    }

    @PreUpdate
    void aoAtualizar() {
        atualizadoEm = LocalDateTime.now();
    }

    public void substituirServicos(List<Servico> novos) {
        servicos.clear();
        novos.forEach(s -> {
            s.setOrcamento(this);
            servicos.add(s);
        });
    }

    public void substituirPecas(List<Peca> novas) {
        pecas.clear();
        novas.forEach(p -> {
            p.setOrcamento(this);
            pecas.add(p);
        });
    }

    public Long getId() {
        return id;
    }

    public String getNomeCliente() {
        return nomeCliente;
    }

    public void setNomeCliente(String nomeCliente) {
        this.nomeCliente = nomeCliente;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public LocalDate getDataEntrega() {
        return dataEntrega;
    }

    public void setDataEntrega(LocalDate dataEntrega) {
        this.dataEntrega = dataEntrega;
    }

    public LocalTime getHorarioEntrega() {
        return horarioEntrega;
    }

    public void setHorarioEntrega(LocalTime horarioEntrega) {
        this.horarioEntrega = horarioEntrega;
    }

    public StatusOrcamento getStatus() {
        return status;
    }

    public void setStatus(StatusOrcamento status) {
        this.status = status;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public LocalDate getDataOrcamento() {
        return dataOrcamento;
    }

    public void setDataOrcamento(LocalDate dataOrcamento) {
        this.dataOrcamento = dataOrcamento;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    /** Soma dos serviços mais as peças (valor unitário vezes quantidade). */
    public BigDecimal getValorTotal() {
        BigDecimal total = BigDecimal.ZERO;
        for (Servico s : servicos) {
            total = total.add(s.getValor());
        }
        for (Peca p : pecas) {
            total = total.add(p.getSubtotal());
        }
        return total;
    }

    public List<Servico> getServicos() {
        return servicos;
    }

    public List<Peca> getPecas() {
        return pecas;
    }
}
