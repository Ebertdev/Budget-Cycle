package br.com.lojabike.orcamentos.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record OrcamentoRequest(
        @NotBlank(message = "Informe o nome do cliente")
        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
        String nomeCliente,

        @NotBlank(message = "Informe o telefone")
        @Pattern(regexp = "^\\d{10,11}$", message = "Informe DDD e 8 ou 9 dígitos, só números")
        String telefone,

        @NotNull(message = "Informe a data de entrega")
        @FutureOrPresent(message = "A data não pode ser passada")
        LocalDate dataEntrega,

        @NotNull(message = "Informe o horário de entrega")
        LocalTime horarioEntrega,

        @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres")
        String observacoes,

        @NotEmpty(message = "Informe ao menos um serviço")
        @Valid
        List<ServicoDto> servicos,

        @Valid
        List<PecaDto> pecas) {

    public record ServicoDto(
            @NotBlank(message = "Descreva o serviço")
            @Size(max = 200, message = "A descrição deve ter no máximo 200 caracteres")
            String descricao,

            @NotNull(message = "Informe o valor do serviço")
            @DecimalMin(value = "0.00", message = "O valor não pode ser negativo")
            @Digits(integer = 8, fraction = 2, message = "Use até 2 casas decimais")
            BigDecimal valor) {
    }

    public record PecaDto(
            @NotBlank(message = "Informe o nome da peça")
            @Size(max = 150, message = "O nome da peça deve ter no máximo 150 caracteres")
            String nomePeca,

            @NotNull(message = "Informe a quantidade")
            @Min(value = 1, message = "A quantidade deve ser pelo menos 1")
            Integer quantidade,

            @NotNull(message = "Informe o valor unitário da peça")
            @DecimalMin(value = "0.00", message = "O valor não pode ser negativo")
            @Digits(integer = 8, fraction = 2, message = "Use até 2 casas decimais")
            BigDecimal valorUnitario) {
    }
}
