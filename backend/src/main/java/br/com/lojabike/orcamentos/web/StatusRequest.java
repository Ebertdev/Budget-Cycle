package br.com.lojabike.orcamentos.web;

import br.com.lojabike.orcamentos.domain.StatusOrcamento;
import jakarta.validation.constraints.NotNull;

public record StatusRequest(@NotNull(message = "Informe o status") StatusOrcamento status) {}
