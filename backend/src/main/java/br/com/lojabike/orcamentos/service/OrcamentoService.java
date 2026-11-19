package br.com.lojabike.orcamentos.service;

import br.com.lojabike.orcamentos.domain.Orcamento;
import br.com.lojabike.orcamentos.domain.OrcamentoRepository;
import br.com.lojabike.orcamentos.domain.Peca;
import br.com.lojabike.orcamentos.domain.Servico;
import br.com.lojabike.orcamentos.domain.StatusOrcamento;
import br.com.lojabike.orcamentos.web.OrcamentoRequest;
import br.com.lojabike.orcamentos.web.OrcamentoResponse;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrcamentoService {

    private final OrcamentoRepository repositorio;

    private final Clock relogio;

    public OrcamentoService(OrcamentoRepository repositorio, Clock relogio) {
        this.repositorio = repositorio;
        this.relogio = relogio;
    }

    @Transactional
    public OrcamentoResponse criar(OrcamentoRequest req) {
        Orcamento orcamento = new Orcamento();
        orcamento.setDataOrcamento(LocalDate.now(relogio));
        aplicar(orcamento, req);
        orcamento = repositorio.saveAndFlush(orcamento);
        return OrcamentoResponse.de(orcamento, avisos(orcamento));
    }

    @Transactional(readOnly = true)
    public Page<OrcamentoResponse> listar(String busca, LocalDate dataEntrega, LocalDate entregaDe,
            LocalDate entregaAte, boolean pendentes, Pageable pagina) {
        return repositorio.findAll(filtro(busca, dataEntrega, entregaDe, entregaAte, pendentes), pagina)
                .map(o -> OrcamentoResponse.de(o, List.of()));
    }

    @Transactional(readOnly = true)
    public OrcamentoResponse buscar(Long id) {
        return OrcamentoResponse.de(obter(id), List.of());
    }

    @Transactional
    public OrcamentoResponse atualizar(Long id, OrcamentoRequest req) {
        Orcamento orcamento = obter(id);
        if (orcamento.getStatus().bloqueiaEdicao()) {
            throw new ConflitoException(
                    "Orçamento com status " + orcamento.getStatus() + " não pode ser editado");
        }
        aplicar(orcamento, req);
        orcamento = repositorio.saveAndFlush(orcamento);
        return OrcamentoResponse.de(orcamento, avisos(orcamento));
    }

    @Transactional
    public OrcamentoResponse mudarStatus(Long id, StatusOrcamento novo) {
        Orcamento orcamento = obter(id);
        if (orcamento.getStatus().bloqueiaEdicao()) {
            throw new ConflitoException(
                    "Orçamento com status " + orcamento.getStatus() + " não pode mudar de status");
        }
        orcamento.setStatus(novo);
        orcamento = repositorio.saveAndFlush(orcamento);
        return OrcamentoResponse.de(orcamento, List.of());
    }

    @Transactional
    public void excluir(Long id) {
        repositorio.delete(obter(id));
    }

    private Orcamento obter(Long id) {
        return repositorio.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Orçamento " + id + " não encontrado"));
    }

    private void aplicar(Orcamento o, OrcamentoRequest req) {
        o.setNomeCliente(req.nomeCliente().trim());
        o.setTelefone(req.telefone());
        o.setDataEntrega(req.dataEntrega());
        o.setHorarioEntrega(req.horarioEntrega());
        o.setObservacoes(req.observacoes());
        o.substituirServicos(req.servicos().stream()
                .map(s -> new Servico(s.descricao().trim(), s.valor())).toList());
        List<OrcamentoRequest.PecaDto> pecas = req.pecas() == null ? List.of() : req.pecas();
        o.substituirPecas(pecas.stream()
                .map(p -> new Peca(p.nomePeca().trim(), p.quantidade(), p.valorUnitario())).toList());
    }

    private List<String> avisos(Orcamento o) {
        long outros = repositorio.countByDataEntregaAndHorarioEntregaAndIdNot(
                o.getDataEntrega(), o.getHorarioEntrega(), o.getId());
        return outros > 0
                ? List.of("Já existe outro orçamento com entrega nesta data e horário")
                : List.of();
    }

    private Specification<Orcamento> filtro(String busca, LocalDate dataEntrega, LocalDate entregaDe,
            LocalDate entregaAte, boolean pendentes) {
        return (raiz, consulta, cb) -> {
            List<jakarta.persistence.criteria.Predicate> condicoes = new ArrayList<>();
            if (busca != null && !busca.isBlank()) {
                String termo = escapar(busca.trim().toLowerCase());
                String digitos = busca.replaceAll("\\D", "");
                var porNome = cb.like(cb.lower(raiz.get("nomeCliente")), "%" + termo + "%", '\\');
                if (digitos.isEmpty()) {
                    condicoes.add(porNome);
                } else {
                    condicoes.add(cb.or(porNome, cb.like(raiz.get("telefone"), "%" + digitos + "%")));
                }
            }
            if (dataEntrega != null) {
                condicoes.add(cb.equal(raiz.get("dataEntrega"), dataEntrega));
            }
            if (entregaDe != null) {
                condicoes.add(cb.greaterThanOrEqualTo(raiz.get("dataEntrega"), entregaDe));
            }
            if (entregaAte != null) {
                condicoes.add(cb.lessThanOrEqualTo(raiz.get("dataEntrega"), entregaAte));
            }
            if (pendentes) {
                condicoes.add(raiz.get("status").in(
                        StatusOrcamento.ABERTO, StatusOrcamento.APROVADO,
                        StatusOrcamento.EM_EXECUCAO, StatusOrcamento.PRONTO));
            }
            return cb.and(condicoes.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private static String escapar(String termo) {
        return termo.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
