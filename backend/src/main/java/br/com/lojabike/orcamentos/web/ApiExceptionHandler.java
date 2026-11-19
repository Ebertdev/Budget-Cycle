package br.com.lojabike.orcamentos.web;

import br.com.lojabike.orcamentos.service.ConflitoException;
import br.com.lojabike.orcamentos.service.NaoEncontradoException;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErroResponse(int status, String erro, List<CampoErro> campos) {
    }

    public record CampoErro(String campo, String mensagem) {
    }

    private static ResponseEntity<ErroResponse> resposta(HttpStatus status, String erro, List<CampoErro> campos) {
        return ResponseEntity.status(status).body(new ErroResponse(status.value(), erro, campos));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErroResponse> validacao(MethodArgumentNotValidException ex) {
        List<CampoErro> campos = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new CampoErro(e.getField(), e.getDefaultMessage()))
                .toList();
        return resposta(HttpStatus.BAD_REQUEST, "Dados inválidos", campos);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErroResponse> requisicaoInvalida(Exception ex) {
        return resposta(HttpStatus.BAD_REQUEST, "Requisição inválida", null);
    }

    @ExceptionHandler(NaoEncontradoException.class)
    ResponseEntity<ErroResponse> naoEncontrado(NaoEncontradoException ex) {
        return resposta(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ErroResponse> rotaInexistente(NoResourceFoundException ex) {
        return resposta(HttpStatus.NOT_FOUND, "Recurso não encontrado", null);
    }

    @ExceptionHandler(ConflitoException.class)
    ResponseEntity<ErroResponse> conflito(ConflitoException ex) {
        return resposta(HttpStatus.CONFLICT, ex.getMessage(), null);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErroResponse> inesperado(Exception ex) {
        log.error("Erro inesperado", ex);
        return resposta(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno do servidor", null);
    }
}
