package com.nbh.auth.service;

import com.nbh.auth.model.User;
import com.nbh.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        processOAuthPostLogin(oAuth2User, userRequest.getClientRegistration().getRegistrationId());
        return oAuth2User;
    }

    private void processOAuthPostLogin(OAuth2User oAuth2User, String provider) {
        String email = oAuth2User.getAttribute("email");
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            User newUser = User.builder()
                    .email(email)
                    .name(oAuth2User.getAttribute("name"))
                    .provider(provider)
                    .providerId(oAuth2User.getName()) // usually subject
                    .role(User.Role.USER) // Default role
                    .build();
            userRepository.save(newUser);
        }
        // If user exists, we could update details here
    }
}
