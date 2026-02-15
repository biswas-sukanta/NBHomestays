package com.nbh.backend.config;

import com.nbh.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthFilter;
        private final AuthenticationProvider authenticationProvider;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable())
                                .cors(cors -> cors.configurationSource(request -> {
                                        var corsConfig = new org.springframework.web.cors.CorsConfiguration();
                                        corsConfig.setAllowedOriginPatterns(java.util.List.of("*"));
                                        corsConfig.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE",
                                                        "OPTIONS", "PATCH"));
                                        corsConfig.setAllowedHeaders(java.util.List.of("*"));
                                        corsConfig.setAllowCredentials(true);
                                        return corsConfig;
                                }))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/api/auth/**", "/actuator/**", "/error",
                                                                "/api/homestays/**",
                                                                "/api/posts/**",
                                                                "/api/reviews/homestay/**", "/v3/api-docs/**",
                                                                "/swagger-ui/**", "/swagger-ui.html")
                                                .permitAll()
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/bookings/**").authenticated()
                                                .requestMatchers("/api/reviews/**").authenticated()
                                                .requestMatchers("/api/host/**").hasRole("HOST")
                                                .anyRequest().authenticated())
                                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authenticationProvider(authenticationProvider)
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}
