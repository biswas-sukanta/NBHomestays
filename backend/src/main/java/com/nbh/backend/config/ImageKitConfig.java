package com.nbh.backend.config;

import io.imagekit.sdk.ImageKit;
import io.imagekit.sdk.config.Configuration;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;

@org.springframework.context.annotation.Configuration
@Slf4j
public class ImageKitConfig {

    @Value("${IMAGEKIT_PUBLIC_KEY:}")
    private String publicKey;

    @Value("${IMAGEKIT_PRIVATE_KEY:}")
    private String privateKey;

    @Value("${IMAGEKIT_URL_ENDPOINT:}")
    private String urlEndpoint;

    @PostConstruct
    public void initImageKit() {
        if (publicKey.isBlank() || privateKey.isBlank() || urlEndpoint.isBlank()) {
            log.warn("[IMAGEKIT DIAGNOSTIC] SKIPPED: Missing ImageKit credentials.");
            return;
        }

        try {
            Configuration config = new Configuration(publicKey, privateKey, urlEndpoint);
            ImageKit.getInstance().setConfig(config);
            log.info("[IMAGEKIT DIAGNOSTIC] SUCCESS: ImageKit SDK initialized successfully with endpoint: {}",
                    urlEndpoint);
        } catch (Exception e) {
            log.error("[IMAGEKIT DIAGNOSTIC] FATAL ERROR: Failed to initialize ImageKit. Check environment variables.",
                    e);
        }
    }
}
