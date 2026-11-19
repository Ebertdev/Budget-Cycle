package br.com.lojabike.orcamentos.web;

import br.com.lojabike.orcamentos.domain.Orcamento;
import br.com.lojabike.orcamentos.domain.StatusOrcamento;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public record OrcamentoResponse(
        Long id,
        String nomeCliente,
        String telefone,
        LocalDate dataEntrega,
        LocalTime horarioEntrega,
        StatusOrcamento status,
        String observacoes,
        List<ServicoResponse> servicos,
        List<PecaResponse> pecas,
        BigDecimal valorTotal,
        LocalDate dataOrcamento,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        List<String> avisos) {

    public record ServicoResponse(Long id, String descricao, BigDecimal valor) {
    }

    public record PecaResponse(
            Long id, String nomePeca, int quantidade, BigDecimal valorUnitario, BigDecimal subtotal) {
    }

    public static OrcamentoResponse de(Orcamento o, List<String> avisos) {
        return new OrcamentoResponse(
                o.getId(),
                o.getNomeCliente(),
                o.getTelefone(),
                o.getDataEntrega(),
                o.getHorarioEntrega(),
                o.getStatus(),
                o.getObservacoes(),
                o.getServicos().stream()
                        .map(s -> new ServicoResponse(s.getId(), s.getDescricao(), s.getValor())).toList(),
                o.getPecas().stream()
                        .map(p -> new PecaResponse(
                                p.getId(), p.getNomePeca(), p.getQuantidade(),
                                p.getValorUnitario(), p.getSubtotal())).toList(),
                o.getValorTotal(),
                o.getDataOrcamento(),
                o.getCriadoEm(),
                o.getAtualizadoEm(),
                avisos);
    }
}
