package br.com.lojabike.orcamentos.domain;

import java.time.LocalDate;
import java.time.LocalTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface OrcamentoRepository
        extends JpaRepository<Orcamento, Long>, JpaSpecificationExecutor<Orcamento> {

    long countByDataEntregaAndHorarioEntregaAndIdNot(LocalDate data, LocalTime horario, Long id);
}
