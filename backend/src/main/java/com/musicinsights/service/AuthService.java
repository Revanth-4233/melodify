package com.musicinsights.service;

import com.musicinsights.dto.*;
import com.musicinsights.entity.User;
import com.musicinsights.exception.DuplicateResourceException;
import com.musicinsights.repository.UserRepository;
import com.musicinsights.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    public JwtResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword())
        );
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername());
        return new JwtResponse(token, user.getId(), user.getUsername(), user.getEmail(), 
                               user.getFullName(), user.getPreferredLanguages(), user.getPreferredArtists());
    }

    public JwtResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid username or password");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        String token = jwtUtil.generateToken(user.getUsername());
        return new JwtResponse(token, user.getId(), user.getUsername(), user.getEmail(),
                               user.getFullName(), user.getPreferredLanguages(), user.getPreferredArtists());
    }

    public JwtResponse updatePreferences(String username, PreferencesRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        user.setFullName(request.getFullName());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setPreferredLanguages(String.join(",", request.getPreferredLanguages()));
        user.setPreferredArtists(String.join(",", request.getPreferredArtists()));
        
        userRepository.save(user);
        
        String token = jwtUtil.generateToken(user.getUsername());
        return new JwtResponse(token, user.getId(), user.getUsername(), user.getEmail(),
                               user.getFullName(), user.getPreferredLanguages(), user.getPreferredArtists());
    }

    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
    }
}
