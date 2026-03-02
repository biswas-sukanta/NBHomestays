package com.nbh.backend.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.CommandLineRunner;

@TestConfiguration
@Profile("h2-test")
public class TestConfig {

    @Bean
    @Primary
    public CommandLineRunner disableDataSeeders() {
        return args -> {
            // Disable all data seeders for H2 tests
            System.out.println("H2 Test Profile: Data seeders disabled");
        };
    }
}
