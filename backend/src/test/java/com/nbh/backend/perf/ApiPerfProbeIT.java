package com.nbh.backend.perf;

import com.nbh.backend.model.Destination;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.State;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.DestinationRepository;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.StateRepository;
import com.nbh.backend.repository.UserRepository;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5432/nbh_db?currentSchema=perf_probe",
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "spring.datasource.username=admin",
        "spring.datasource.password=password",
        "spring.datasource.hikari.connection-init-sql=CREATE SCHEMA IF NOT EXISTS perf_probe; SET search_path TO perf_probe",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.default_schema=perf_probe",
        "spring.flyway.enabled=false",
        "spring.jpa.show-sql=true",
        "spring.jpa.properties.hibernate.generate_statistics=true",
        "app.cache.redis.enabled=false",
        "application.data-seeding.enabled=false",
        "application.security.jwt.secret-key=bXlfc3VwZXJfc2VjcmV0X2tleV8zMl9ieXRlc19sb25nX2Zvcl9qc3c="
})
class ApiPerfProbeIT {

    @LocalServerPort
    int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StateRepository stateRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private HomestayRepository homestayRepository;

    @Autowired
    private jakarta.persistence.EntityManagerFactory emf;

    @BeforeEach
    void seed() {
        homestayRepository.deleteAll();
        destinationRepository.deleteAll();
        stateRepository.deleteAll();
        userRepository.deleteAll();

        User owner = User.builder()
                .email("perf-owner@nbh.com")
                .password("x")
                .enabled(true)
                .firstName("Perf")
                .lastName("Owner")
                .role(User.Role.ROLE_HOST)
                .build();
        owner = userRepository.save(owner);

        List<State> states = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            State s = State.builder()
                    .slug("state-" + i)
                    .name("State " + i)
                    .description("State desc " + i)
                    .heroImageName("hero-" + i + ".webp")
                    .build();
            states.add(stateRepository.save(s));
        }

        List<Destination> destinations = new ArrayList<>();
        for (int i = 0; i < 60; i++) {
            State s = states.get(i % states.size());
            Destination d = Destination.builder()
                    .slug("dest-" + i)
                    .name("Destination " + i)
                    .district("District " + i)
                    .heroTitle("Hero " + i)
                    .description("Description " + i)
                    .localImageName("img-" + i + ".webp")
                    .state(s)
                    .tags(List.of("tag-a", "tag-b", "tag-" + (i % 10)))
                    .build();
            destinations.add(destinationRepository.save(d));
        }

        for (int i = 0; i < 400; i++) {
            Destination d = destinations.get(i % destinations.size());
            Homestay h = Homestay.builder()
                    .name("Stay " + i)
                    .description("Description " + i)
                    .owner(owner)
                    .pricePerNight(1000 + i)
                    .latitude(26.0 + (i % 20) * 0.01)
                    .longitude(88.0 + (i % 20) * 0.01)
                    .address("Addr " + i)
                    .amenities(Map.of("Wifi", true))
                    .policies(List.of("P1"))
                    .quickFacts(Map.of("Check-in", "13:00"))
                    .tags(List.of("Trending Now"))
                    .hostDetails(Map.of("rating", 4.5))
                    .status(Homestay.Status.APPROVED)
                    .featured(i % 10 == 0)
                    .vibeScore(4.5)
                    .destination(d)
                    .build();
            homestayRepository.save(h);
        }
    }

    @Test
    void profileSlowEndpoints() {
        Statistics statistics = emf.unwrap(SessionFactory.class).getStatistics();
        measureWithWarmRuns(statistics, "/api/destinations", 3);
        measureWithWarmRuns(statistics, "/api/states", 3);
        measureWithWarmRuns(statistics, "/api/homestays/search?size=12&page=0", 3);
    }

    private void measureWithWarmRuns(Statistics statistics, String path, int runs) {
        // warm-up
        restTemplate.getForEntity("http://localhost:" + port + path, String.class);

        long totalElapsedMs = 0;
        for (int i = 1; i <= runs; i++) {
            statistics.clear();
            long start = System.nanoTime();
            var response = restTemplate.getForEntity("http://localhost:" + port + path, String.class);
            long elapsedMs = (System.nanoTime() - start) / 1_000_000;
            totalElapsedMs += elapsedMs;

            System.out.printf(
                    "PERF_PROBE_RUN path=%s run=%d status=%d elapsedMs=%d sqlStatements=%d queryExecutions=%d maxQueryMs=%d entityLoads=%d collectionLoads=%d collectionFetches=%d%n",
                    path,
                    i,
                    response.getStatusCode().value(),
                    elapsedMs,
                    statistics.getPrepareStatementCount(),
                    statistics.getQueryExecutionCount(),
                    statistics.getQueryExecutionMaxTime(),
                    statistics.getEntityLoadCount(),
                    statistics.getCollectionLoadCount(),
                    statistics.getCollectionFetchCount());
        }

        System.out.printf("PERF_PROBE_SUMMARY path=%s avgElapsedMs=%d runs=%d%n", path, (totalElapsedMs / runs), runs);
    }
}
