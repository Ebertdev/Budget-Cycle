package br.com.lojabike.orcamentos.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String origem;

    public CorsConfig(@Value("${app.cors.origin}") String origem) {
        this.origem = origem;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origem)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE");
    }
}
