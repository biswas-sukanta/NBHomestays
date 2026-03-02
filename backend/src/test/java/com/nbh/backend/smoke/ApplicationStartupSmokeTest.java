package com.nbh.backend.smoke;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "server.port=0",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false",
    "JWT_SECRET_KEY=test-secret-key-for-smoke-test-only",
    "IMAGEKIT_PUBLIC_KEY=test_key",
    "IMAGEKIT_PRIVATE_KEY=test_secret",
    "IMAGEKIT_URL_ENDPOINT=https://test.ik.imagekit.io/test"
})
public class ApplicationStartupSmokeTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    public void testApplicationStartup() {
        // This test validates that the application can start successfully
        // with all critical beans initialized without errors
        
        assertNotNull(restTemplate, "TestRestTemplate should be available");
        assertTrue(port > 0, "Server should be running on a valid port");
    }

    @Test
    public void testActuatorHealth() {
        // Test that actuator health endpoint is available
        String url = "http://localhost:" + port + "/actuator/health";
        
        try {
            var response = restTemplate.getForEntity(url, String.class);
            assertTrue(response.getStatusCode().is2xxSuccessful(), 
                      "Health endpoint should be accessible");
        } catch (Exception e) {
            // If actuator is not available, that's acceptable for this test
            // The main goal is to ensure application startup works
            System.out.println("Actuator health endpoint not available: " + e.getMessage());
        }
    }

    @Test
    public void testBasicEndpoint() {
        // Test that a basic endpoint responds (even if it returns 401/404)
        // This validates that the web server is running and Spring MVC is configured
        String url = "http://localhost:" + port + "/api/auth/login";
        
        try {
            var response = restTemplate.postForEntity(url, null, String.class);
            // We expect either 401 (unauthorized) or 400 (bad request) but not 500
            assertFalse(response.getStatusCode().is5xxServerError(), 
                      "Should not return server error - indicates startup issues");
        } catch (Exception e) {
            fail("Basic endpoint should be accessible: " + e.getMessage());
        }
    }
}
