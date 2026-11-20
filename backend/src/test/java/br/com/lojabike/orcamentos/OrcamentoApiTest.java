package br.com.lojabike.orcamentos;

import java.time.LocalDate;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.lojabike.orcamentos.domain.Orcamento;
import br.com.lojabike.orcamentos.domain.OrcamentoRepository;
import br.com.lojabike.orcamentos.domain.StatusOrcamento;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrcamentoApiTest {

    private static final String URL = "/api/v1/orcamentos";

    @Autowired
    MockMvc mvc;

    @Autowired
    OrcamentoRepository repository;

    @BeforeEach
    void limpar() {
        repository.deleteAll();
    }

    private String corpo(String nome, String telefone, LocalDate data, String horario,
                         String servicos, String pecas) {
        return """
            {
              "nomeCliente": "%s",
              "telefone": "%s",
              "dataEntrega": "%s",
              "horarioEntrega": "%s",
              "observacoes": "Revisão completa",
              "servicos": %s,
              "pecas": %s
            }
            """.formatted(nome, telefone, data, horario, servicos, pecas);
    }

    private String corpoValido(String nome, String telefone) {
        return corpo(nome, telefone, LocalDate.now().plusDays(3), "15:30",
            "[{\"descricao\":\"Revisão geral\",\"valor\":120.00},{\"descricao\":\"Ajuste de freio\",\"valor\":35.50}]",
            "[{\"nomePeca\":\"Câmara de ar aro 29\",\"quantidade\":2,\"valorUnitario\":30.00}]");
    }

    private ResultActions criar(String json) throws Exception {
        return mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void criaOrcamentoComServicosEPecas() throws Exception {
        criar(corpoValido("Maria Souza", "71999990000"))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", containsString(URL + "/")))
            .andExpect(jsonPath("$.id", notNullValue()))
            .andExpect(jsonPath("$.status", is("ABERTO")))
            .andExpect(jsonPath("$.servicos", hasSize(2)))
            .andExpect(jsonPath("$.pecas", hasSize(1)))
            .andExpect(jsonPath("$.pecas[0].quantidade", is(2)))
            .andExpect(jsonPath("$.pecas[0].valorUnitario", is(30.00)))
            .andExpect(jsonPath("$.pecas[0].subtotal", is(60.00)))
            .andExpect(jsonPath("$.servicos[1].valor", is(35.50)))
            .andExpect(jsonPath("$.valorTotal", is(215.50)))
            .andExpect(jsonPath("$.avisos", hasSize(0)));
    }

    @Test
    void registraADataEmQueOOrcamentoFoiFeitoNoFusoDaLoja() throws Exception {
        String hoje = LocalDate.now(java.time.ZoneId.of("America/Bahia")).toString();
        criar(corpoValido("Maria Souza", "71999990000"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.dataOrcamento", is(hoje)));
    }

    @Test
    void naoPermiteAlterarADataDoOrcamentoNaEdicao() throws Exception {
        String resposta = criar(corpoValido("Maria Souza", "71999990000"))
            .andReturn().getResponse().getContentAsString();
        String id = com.jayway.jsonpath.JsonPath.read(resposta, "$.id").toString();
        mvc.perform(put(URL + "/" + id).contentType(MediaType.APPLICATION_JSON)
                .content(corpoValido("Maria Souza", "71999990000")
                    .replace("\"nomeCliente\"", "\"dataOrcamento\": \"2000-01-01\", \"nomeCliente\"")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.dataOrcamento",
                is(LocalDate.now(java.time.ZoneId.of("America/Bahia")).toString())));
    }

    @Test
    void criaOrcamentoSemPecas() throws Exception {
        criar(corpo("Maria Souza", "71999990000", LocalDate.now().plusDays(1), "10:00",
            "[{\"descricao\":\"Regulagem de câmbio\",\"valor\":60.00}]", "[]"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.pecas", hasSize(0)));
    }

    @Test
    void rejeitaTelefoneInvalido() throws Exception {
        criar(corpoValido("Maria Souza", "123"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status", is(400)))
            .andExpect(jsonPath("$.campos[0].campo", is("telefone")));
    }

    @Test
    void rejeitaDataDeEntregaPassada() throws Exception {
        criar(corpo("Maria Souza", "71999990000", LocalDate.now().minusDays(1), "10:00",
            "[{\"descricao\":\"Revisão geral\",\"valor\":120.00}]", "[]"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.campos[0].campo", is("dataEntrega")));
    }

    @Test
    void rejeitaOrcamentoSemServicos() throws Exception {
        criar(corpo("Maria Souza", "71999990000", LocalDate.now().plusDays(1), "10:00", "[]", "[]"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.campos[0].campo", is("servicos")));
    }

    @Test
    void rejeitaPecaComQuantidadeZero() throws Exception {
        criar(corpo("Maria Souza", "71999990000", LocalDate.now().plusDays(1), "10:00",
            "[{\"descricao\":\"Revisão geral\",\"valor\":120.00}]",
            "[{\"nomePeca\":\"Corrente\",\"quantidade\":0,\"valorUnitario\":80.00}]"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.campos[0].campo", is("pecas[0].quantidade")));
    }

    @Test
    void buscaPorIdInexistenteRetorna404EmJson() throws Exception {
        mvc.perform(get(URL + "/9999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status", is(404)))
            .andExpect(jsonPath("$.erro", notNullValue()));
    }

    @Test
    void buscaPorParteDoNomeSemDiferenciarCaixa() throws Exception {
        criar(corpoValido("Maria Souza", "71999990000")).andExpect(status().isCreated());
        criar(corpoValido("João Lima", "71988887777")).andExpect(status().isCreated());

        mvc.perform(get(URL).param("busca", "maria"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements", is(1)))
            .andExpect(jsonPath("$.content[0].nomeCliente", is("Maria Souza")));
    }

    @Test
    void buscaPorTelefoneIgnorandoMascara() throws Exception {
        criar(corpoValido("Maria Souza", "71999990000")).andExpect(status().isCreated());
        criar(corpoValido("João Lima", "71988887777")).andExpect(status().isCreated());

        mvc.perform(get(URL).param("busca", "(71) 99999"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements", is(1)))
            .andExpect(jsonPath("$.content[0].nomeCliente", is("Maria Souza")));
    }

    @Test
    void buscaVaziaListaTudoEFiltraPorData() throws Exception {
        LocalDate dia = LocalDate.now().plusDays(5);
        criar(corpo("Maria Souza", "71999990000", dia, "09:00",
            "[{\"descricao\":\"Revisão geral\",\"valor\":120.00}]", "[]")).andExpect(status().isCreated());
        criar(corpoValido("João Lima", "71988887777")).andExpect(status().isCreated());

        mvc.perform(get(URL).param("busca", ""))
            .andExpect(jsonPath("$.totalElements", is(2)));
        mvc.perform(get(URL).param("dataEntrega", dia.toString()))
            .andExpect(jsonPath("$.totalElements", is(1)))
            .andExpect(jsonPath("$.content[0].nomeCliente", is("Maria Souza")));
    }

    @Test
    void avisaSemBloquearQuandoHorarioJaOcupado() throws Exception {
        criar(corpoValido("Maria Souza", "71999990000")).andExpect(status().isCreated());

        criar(corpoValido("João Lima", "71988887777"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.avisos", hasSize(1)));
    }

    @Test
    void editaOrcamentoERemoveTodasAsPecas() throws Exception {
        String resposta = criar(corpoValido("Maria Souza", "71999990000"))
            .andReturn().getResponse().getContentAsString();
        String id = resposta.replaceAll("(?s).*?\"id\":(\\d+).*", "$1");

        String novo = corpo("Maria S. Lima", "71999990000", LocalDate.now().plusDays(4), "11:00",
            "[{\"descricao\":\"Troca de corrente\",\"valor\":25.00}]", "[]");
        mvc.perform(put(URL + "/" + id).contentType(MediaType.APPLICATION_JSON).content(novo))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nomeCliente", is("Maria S. Lima")))
            .andExpect(jsonPath("$.servicos", hasSize(1)))
            .andExpect(jsonPath("$.pecas", hasSize(0)));
    }

    @Test
    void naoEditaOrcamentoEntregue() throws Exception {
        criar(corpoValido("Maria Souza", "71999990000")).andExpect(status().isCreated());
        Orcamento o = repository.findAll().get(0);
        o.setStatus(StatusOrcamento.ENTREGUE);
        repository.save(o);

        mvc.perform(put(URL + "/" + o.getId()).contentType(MediaType.APPLICATION_JSON)
                .content(corpoValido("Maria Souza", "71999990000")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.status", is(409)));
    }

    @Test
    void excluiOrcamento() throws Exception {
        criar(corpoValido("Maria Souza", "71999990000")).andExpect(status().isCreated());
        Long id = repository.findAll().get(0).getId();

        mvc.perform(delete(URL + "/" + id)).andExpect(status().isNoContent());
        mvc.perform(get(URL + "/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void filtraEntregasPendentesPorIntervaloDeDatas() throws Exception {
        LocalDate hoje = LocalDate.now();
        criar(corpo("Hoje Aberto", "71999990000", hoje, "09:00",
            "[{\"descricao\":\"Revisão geral\",\"valor\":120.00}]", "[]")).andExpect(status().isCreated());
        criar(corpo("Daqui a 10 dias", "71988887777", hoje.plusDays(10), "10:30",
            "[{\"descricao\":\"Revisão geral\",\"valor\":120.00}]", "[]")).andExpect(status().isCreated());
        criar(corpo("Já entregue", "71977776666", hoje, "14:00",
            "[{\"descricao\":\"Revisão geral\",\"valor\":120.00}]", "[]")).andExpect(status().isCreated());
        Orcamento entregue = repository.findAll().stream()
            .filter(o -> o.getNomeCliente().equals("Já entregue")).findFirst().orElseThrow();
        entregue.setStatus(StatusOrcamento.ENTREGUE);
        repository.save(entregue);

        mvc.perform(get(URL).param("entregaDe", hoje.toString())
                .param("entregaAte", hoje.plusDays(6).toString())
                .param("pendentes", "true")
                .param("sort", "dataEntrega,asc"))
            .andExpect(jsonPath("$.totalElements", is(1)))
            .andExpect(jsonPath("$.content[0].nomeCliente", is("Hoje Aberto")));
        mvc.perform(get(URL).param("entregaDe", hoje.toString()).param("pendentes", "true"))
            .andExpect(jsonPath("$.totalElements", is(2)));
    }

    @Test
    void mudaStatusEBloqueiaDepoisDeEntregue() throws Exception {
        criar(corpoValido("Maria Souza", "71999990000")).andExpect(status().isCreated());
        Long id = repository.findAll().get(0).getId();

        mvc.perform(patch(URL + "/" + id + "/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"EM_EXECUCAO\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("EM_EXECUCAO")));
        mvc.perform(patch(URL + "/" + id + "/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ENTREGUE\"}"))
            .andExpect(status().isOk());
        mvc.perform(patch(URL + "/" + id + "/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"ABERTO\"}"))
            .andExpect(status().isConflict());
        mvc.perform(patch(URL + "/" + id + "/status").contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void rejeitaValoresAusentesOuNegativos() throws Exception {
        criar(corpo("Maria Souza", "71999990000", LocalDate.now(), "09:00",
            "[{\"descricao\":\"Revisão geral\"}]", "[]"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.campos[0].campo", is("servicos[0].valor")));
        criar(corpo("Maria Souza", "71999990000", LocalDate.now(), "09:00",
            "[{\"descricao\":\"Revisão geral\",\"valor\":-1}]", "[]"))
            .andExpect(status().isBadRequest());
        criar(corpo("Maria Souza", "71999990000", LocalDate.now(), "09:00",
            "[{\"descricao\":\"Revisão geral\",\"valor\":10.005}]", "[]"))
            .andExpect(status().isBadRequest());
        criar(corpo("Maria Souza", "71999990000", LocalDate.now(), "09:00",
            "[{\"descricao\":\"Revisão geral\",\"valor\":10}]",
            "[{\"nomePeca\":\"Corrente\",\"quantidade\":1}]"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.campos[0].campo", is("pecas[0].valorUnitario")));
    }
}
