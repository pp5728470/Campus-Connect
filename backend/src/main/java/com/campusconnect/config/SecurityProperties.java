package com.campusconnect.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Login hardening settings ({@code app.security.*}). */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

    /** Consecutive failed logins before the account is temporarily locked. */
    private int lockoutMaxAttempts = 5;

    /** How long a locked account stays locked, in minutes. */
    private long lockoutDurationMinutes = 15;

    /** Maximum login requests per minute from a single client IP. */
    private int loginRateLimitPerMinute = 5;
}
