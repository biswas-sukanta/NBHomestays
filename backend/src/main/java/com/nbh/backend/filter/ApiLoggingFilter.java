package com.nbh.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.concurrent.CompletableFuture;

@Component
public class ApiLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(ApiLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip file uploads to prevent payload extraction crashes
        if (request.getContentType() != null && request.getContentType().contains("multipart/form-data")) {
            filterChain.doFilter(request, response);
            return;
        }

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        long startTime = System.currentTimeMillis();

        try {
            // Proceed with the actual API execution
            filterChain.doFilter(wrappedRequest, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;

            // Extract data synchronously before the HTTP response stream closes
            int status = response.getStatus();
            String method = wrappedRequest.getMethod();
            String uri = wrappedRequest.getRequestURI();
            String payload = getRequestBody(wrappedRequest);

            // FIRE AND FORGET: Offload string building and console I/O to a background
            // thread
            CompletableFuture.runAsync(() -> logApiCallAsync(method, uri, status, duration, payload));
        }
    }

    private void logApiCallAsync(String method, String uri, int status, long duration, String payload) {
        StringBuilder logBuilder = new StringBuilder();
        logBuilder.append("\n=================== API REQUEST ===================\n");
        logBuilder.append(String.format("Method      : %s\n", method));
        logBuilder.append(String.format("URI         : %s\n", uri));
        logBuilder.append(String.format("Status      : %d\n", status));
        logBuilder.append(String.format("Time Taken  : %d ms\n", duration));

        if (!payload.isBlank()) {
            logBuilder.append(String.format("Payload     : %s\n", payload.replaceAll("\\s+", " ")));
        }

        logBuilder.append("===================================================");

        logger.info(logBuilder.toString());
    }

    private String getRequestBody(ContentCachingRequestWrapper request) {
        byte[] buf = request.getContentAsByteArray();
        if (buf.length > 0) {
            try {
                return new String(buf, 0, buf.length, request.getCharacterEncoding());
            } catch (UnsupportedEncodingException e) {
                return " [Error parsing request body] ";
            }
        }
        return "";
    }
}
