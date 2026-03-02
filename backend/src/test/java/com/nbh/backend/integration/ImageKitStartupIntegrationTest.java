package com.nbh.backend.integration;

import com.nbh.backend.config.ImageKitConfig;
import io.imagekit.sdk.ImageKit;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "IMAGEKIT_PUBLIC_KEY=test_public_key",
    "IMAGEKIT_PRIVATE_KEY=test_private_key", 
    "IMAGEKIT_URL_ENDPOINT=https://test.ik.imagekit.io/test",
    "application.data-seeding.enabled=false"
})
public class ImageKitStartupIntegrationTest {

    @Test
    public void testImageKitBeanInitialization() {
        // This test ensures ImageKit SDK can be initialized without NoClassDefFoundError
        // This validates OkHttp 4.x compatibility with ImageKit SDK
        
        // Create ImageKitConfig manually to test bean creation
        ImageKitConfig config = new ImageKitConfig();
        
        assertNotNull(config, "ImageKitConfig should be instantiatable");
        
        // The bean creation itself validates that okhttp3.RequestBody is available
        // If OkHttp 5.x was present, this would fail with NoClassDefFoundError
        assertDoesNotThrow(() -> {
            // Test that ImageKit SDK classes can be loaded
            Class.forName("io.imagekit.sdk.ImageKit");
            Class.forName("okhttp3.RequestBody");
            Class.forName("okhttp3.MediaType");
        }, "ImageKit SDK and OkHttp classes should be loadable");
        
        // Test ImageKit initialization
        assertDoesNotThrow(() -> {
            ImageKit imageKit = ImageKit.getInstance();
            assertNotNull(imageKit, "ImageKit instance should be available");
        }, "ImageKit SDK should initialize without NoClassDefFoundError");
    }
}
