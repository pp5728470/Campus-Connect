package com.campusconnect.service;

import com.campusconnect.config.AppProperties;
import com.campusconnect.config.JwtProperties;
import com.campusconnect.dto.auth.LoginRequest;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.mapper.UserMapper;
import com.campusconnect.repository.PasswordResetTokenRepository;
import com.campusconnect.repository.RefreshTokenRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceLoginTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtService jwtService;
    @Mock private LoginAttemptService loginAttemptService;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;

    private AuthService authService;
    private User user;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository, refreshTokenRepository, passwordEncoder, authenticationManager, jwtService,
                new JwtProperties(), new UserMapper(), loginAttemptService, passwordResetTokenRepository,
                new AppProperties());
        user = User.builder().id(3L).email("aarav.mehta@student.college.edu").fullName("Aarav Mehta")
                .passwordHash("hash").role(Role.STUDENT).build();
    }

    @Test
    void wrongPasswordRecordsFailureAndRethrows() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("bad"));

        assertThatThrownBy(() -> authService.login(new LoginRequest(user.getEmail(), "wrong")))
                .isInstanceOf(BadCredentialsException.class);

        verify(loginAttemptService).recordFailure(3L);
        verify(loginAttemptService, never()).recordSuccess(any());
    }

    @Test
    void unknownEmailDoesNotTouchAttemptCounters() {
        when(userRepository.findByEmail("nobody@college.edu")).thenReturn(Optional.empty());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("bad"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@college.edu", "whatever1")))
                .isInstanceOf(BadCredentialsException.class);

        verifyNoInteractions(loginAttemptService);
    }

    @Test
    void lockedAccountIsRejectedBeforeCredentialsAreChecked() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        doThrow(new ApiException(HttpStatus.LOCKED, "locked")).when(loginAttemptService).assertCanLogin(user);

        assertThatThrownBy(() -> authService.login(new LoginRequest(user.getEmail(), "Password@123")))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.LOCKED));

        verifyNoInteractions(authenticationManager);
    }

    @Test
    void successfulLoginClearsFailureState() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setRefreshTokenExpirationMs(60_000);
        authService = new AuthService(
                userRepository, refreshTokenRepository, passwordEncoder, authenticationManager, jwtService,
                jwtProperties, new UserMapper(), loginAttemptService, passwordResetTokenRepository,
                new AppProperties());
        user.setCreatedAt(Instant.now());
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(any())).thenReturn("access-token");

        var response = authService.login(new LoginRequest(user.getEmail(), "Password@123"));

        assertThat(response.accessToken()).isEqualTo("access-token");
        verify(loginAttemptService).recordSuccess(3L);
        verify(loginAttemptService, never()).recordFailure(any());
    }
}