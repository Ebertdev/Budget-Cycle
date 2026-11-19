package br.com.lojabike.orcamentos.web;

import br.com.lojabike.orcamentos.service.OrcamentoService;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orcamentos")
public class OrcamentoController {

    private final OrcamentoService servico;

    public OrcamentoController(OrcamentoService servico) {
        this.servico = servico;
    }

    @PostMapping
    public ResponseEntity<OrcamentoResponse> criar(@Valid @RequestBody OrcamentoRequest req) {
        OrcamentoResponse criado = servico.criar(req);
        return ResponseEntity.created(URI.create("/api/v1/orcamentos/" + criado.id())).body(criado);
    }

    @GetMapping
    public PageResponse<OrcamentoResponse> listar(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataEntrega,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate entregaDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate entregaAte,
            @RequestParam(defaultValue = "false") boolean pendentes,
            @PageableDefault(size = 20, sort = "dataEntrega", direction = Sort.Direction.DESC)
            Pageable pagina) {
        return PageResponse.de(servico.listar(busca, dataEntrega, entregaDe, entregaAte, pendentes, pagina));
    }

    @GetMapping("/{id}")
    public OrcamentoResponse buscar(@PathVariable Long id) {
        return servico.buscar(id);
    }

    @PutMapping("/{id}")
    public OrcamentoResponse atualizar(@PathVariable Long id, @Valid @RequestBody OrcamentoRequest req) {
        return servico.atualizar(id, req);
    }

    @PatchMapping("/{id}/status")
    public OrcamentoResponse mudarStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        return servico.mudarStatus(id, req.status());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        servico.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
