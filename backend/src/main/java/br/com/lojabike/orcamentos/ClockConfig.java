package br.com.lojabike.orcamentos;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Relógio único da aplicação, no fuso da loja (configurável por APP_FUSO). */
@Configuration
public class ClockConfig {

    @Bean
    Clock relogio(@Value("${app.fuso}") String fuso) {
        return Clock.system(ZoneId.of(fuso));
    }
}
