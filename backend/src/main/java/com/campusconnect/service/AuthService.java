package com.campusconnect.service;

import com.campusconnect.config.AppProperties;
import com.campusconnect.config.JwtProperties;
import com.campusconnect.dto.auth.AuthResponse;
import com.campusconnect.dto.auth.ChangePasswordRequest;
import com.campusconnect.dto.auth.ForgotPasswordRequest;
import com.campusconnect.dto.auth.ResetPasswordRequest;
import com.campusconnect.dto.common.MessageResponse;
import com.campusconnect.entity.PasswordResetToken;
import com.campusconnect.repository.PasswordResetTokenRepository;
import com.campusconnect.util.TokenUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import java.time.Duration;
import com.campusconnect.dto.auth.LoginRequest;
import com.campusconnect.dto.auth.RefreshTokenRequest;
import com.campusconnect.dto.auth.RegisterRequest;
import com.campusconnect.dto.user.UserResponse;
import com.campusconnect.entity.RefreshToken;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.mapper.UserMapper;
import com.campusconnect.repository.RefreshTokenRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtService;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Duration RESET_TOKEN_VALIDITY = Duration.ofHours(1);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final UserMapper userMapper;
    private final LoginAttemptService loginAttemptService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AppProperties appProperties;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.role() == Role.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot self-register as ADMIN");
        }
        if (userRepository.existsByEmail(request.email().toLowerCase().trim())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }

        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(request.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(request.role())
                .active(true)
                .build();

        userRepository.save(user);
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().toLowerCase().trim();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            loginAttemptService.assertCanLogin(user);
        }

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (BadCredentialsException ex) {
            if (user != null) {
                loginAttemptService.recordFailure(user.getId());
            }
            throw ex;
        }

        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        loginAttemptService.recordSuccess(user.getId());
        return issueTokens(user);
    }

    /** Verifies the current password, then revokes every session and returns fresh tokens for this one. */
    @Transactional
    public AuthResponse changePassword(ChangePasswordRequest request) {
        User user = userRepository.findById(SecurityUtils.currentUser().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        // 400 rather than 401 so the client does not mistake this for an expired session
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New password must be different from the current one");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        refreshTokenRepository.revokeAllByUserId(user.getId());
        return issueTokens(user);
    }

    /**
     * Always succeeds from the caller's point of view so the endpoint cannot be used to discover
     * which emails are registered. The reset link is written to the server log (no mail server yet).
     */
    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.email().toLowerCase().trim())
                .filter(User::isActive)
                .ifPresent(user -> {
                    passwordResetTokenRepository.invalidateAllForUser(user.getId());

                    String token = TokenUtils.generateToken();
                    passwordResetTokenRepository.save(PasswordResetToken.builder()
                            .user(user)
                            .token(TokenUtils.sha256(token))
                            .expiresAt(Instant.now().plus(RESET_TOKEN_VALIDITY))
                            .build());

                    String baseUrl = appProperties.getFrontendUrl().replaceAll("/+$", "");
                    log.info("Password reset requested for {}. Reset link (valid 1 hour): {}/reset-password?token={}",
                            user.getEmail(), baseUrl, token);
                });
        return new MessageResponse("If an account exists for that email, a password reset link has been sent.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenWithUser(TokenUtils.sha256(request.token().trim()))
                .filter(t -> !t.isUsed() && t.getExpiresAt().isAfter(Instant.now()) && t.getUser().isActive())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "This reset link is invalid or has expired"));

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        resetToken.setUsed(true);
        refreshTokenRepository.revokeAllByUserId(user.getId());
        return new MessageResponse("Your password has been reset. You can now sign in.");
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token is expired or revoked");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return issueTokens(stored.getUser());
    }

    @Transactional
    public void logout() {
        UserPrincipal principal = SecurityUtils.currentUser();
        refreshTokenRepository.revokeAllByUserId(principal.getId());
    }

    @Transactional(readOnly = true)
    public UserResponse me() {
        UserPrincipal principal = SecurityUtils.currentUser();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return userMapper.toResponse(user);
    }

    private AuthResponse issueTokens(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshTokenValue = UUID.randomUUID().toString() + "-" + UUID.randomUUID();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(Instant.now().plusMillis(jwtProperties.getRefreshTokenExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.of(accessToken, refreshTokenValue, userMapper.toResponse(user));
    }
}
