package com.nbh.backend.config;

import io.imagekit.sdk.ImageKit;
import io.imagekit.sdk.config.Configuration;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

@org.springframework.context.annotation.Configuration
@Slf4j
public class ImageKitConfig {

    @Value("${IMAGEKIT_PUBLIC_KEY:}")
    private String publicKey;

    @Value("${IMAGEKIT_PRIVATE_KEY:}")
    private String privateKey;

    @Value("${IMAGEKIT_URL_ENDPOINT:}")
    private String urlEndpoint;

    private boolean initialized = false;

    @PostConstruct
    public void initImageKit() {
        if (publicKey.isBlank() || privateKey.isBlank() || urlEndpoint.isBlank()) {
            log.warn("[IMAGEKIT DIAGNOSTIC] SKIPPED: Missing ImageKit credentials.");
            return;
        }

        try {
            Configuration config = new Configuration(publicKey, privateKey, urlEndpoint);
            ImageKit.getInstance().setConfig(config);
            initialized = true;
            log.info("[IMAGEKIT DIAGNOSTIC] SUCCESS: ImageKit SDK initialized successfully with endpoint: {}",
                    urlEndpoint);
        } catch (Exception e) {
            log.error("[IMAGEKIT DIAGNOSTIC] FATAL ERROR: Failed to initialize ImageKit. Check environment variables.",
                    e);
        }
    }

    /**
     * Startup health check to alert if ImageKit credentials are missing.
     * This ensures visibility of configuration issues before runtime failures.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void validateConfigurationOnStartup() {
        if (!initialized) {
            log.error("================================================================================");
            log.error("[IMAGEKIT CONFIGURATION WARNING] ImageKit credentials not configured!");
            log.error("Image uploads will fail at runtime. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY,");
            log.error("and IMAGEKIT_URL_ENDPOINT environment variables.");
            log.error("================================================================================");
        }
    }
}
