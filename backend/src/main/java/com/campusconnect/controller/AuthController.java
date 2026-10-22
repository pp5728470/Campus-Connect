package com.campusconnect.controller;

import com.campusconnect.dto.auth.AuthResponse;
import com.campusconnect.dto.auth.ChangePasswordRequest;
import com.campusconnect.dto.auth.ForgotPasswordRequest;
import com.campusconnect.dto.auth.ResetPasswordRequest;
import com.campusconnect.dto.common.MessageResponse;
import com.campusconnect.dto.auth.LoginRequest;
import com.campusconnect.dto.auth.RefreshTokenRequest;
import com.campusconnect.dto.auth.RegisterRequest;
import com.campusconnect.dto.user.UserResponse;
import com.campusconnect.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register as TEACHER or STUDENT")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Revoke refresh tokens for current user")
    public void logout() {
        authService.logout();
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password; all sessions are revoked and new tokens are returned")
    public AuthResponse changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return authService.changePassword(request);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset link (always returns 200)")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Set a new password using a reset token")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user")
    public UserResponse me() {
        return authService.me();
    }
}
