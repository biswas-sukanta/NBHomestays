package com.nbh.backend.repository;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
public class HomestayRepositoryTest {

    @Autowired
    private HomestayRepository homestayRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testSearch() {
        // Setup
        User owner = User.builder()
                .firstName("Test")
                .lastName("Owner")
                .email("owner@test.com")
                .password("pass")
                .role(User.Role.ROLE_HOST)
                .build();
        userRepository.save(owner);

        Homestay homestay = Homestay.builder()
                .name("Cozy Cottage in Darjeeling")
                .description("A lovely place with view")
                .pricePerNight(2000)
                .latitude(27.0)
                .longitude(88.0)
                .address("Darjeeling, West Bengal")
                .amenities(Collections.singletonMap("WiFi", true))
                .status(Homestay.Status.APPROVED)
                .owner(owner)
                .build();
        homestayRepository.save(homestay);

        // Test
        List<Homestay> results = homestayRepository.search("Darjeeling", null, 10, 0);

        // Verify
        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getName()).contains("Cozy Cottage");
    }
}
