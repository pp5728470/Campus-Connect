package com.campusconnect.service;

import com.campusconnect.config.SecurityProperties;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Tracks failed logins and temporarily locks accounts after too many attempts.
 * State changes run in their own transaction so they persist even when the login request fails.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final UserRepository userRepository;
    private final SecurityProperties securityProperties;

    /** Rejects deactivated or currently locked accounts before credentials are checked. */
    public void assertCanLogin(User user) {
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This account has been deactivated. Contact an administrator.");
        }
        Instant lockedUntil = user.getLockedUntil();
        if (lockedUntil != null && lockedUntil.isAfter(Instant.now())) {
            long minutes = Math.max(1, Duration.between(Instant.now(), lockedUntil).plusSeconds(59).toMinutes());
            throw new ApiException(HttpStatus.LOCKED,
                    "Too many failed attempts. Try again in " + minutes + (minutes == 1 ? " minute." : " minutes."));
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            Instant now = Instant.now();
            if (user.getLockedUntil() != null && !user.getLockedUntil().isAfter(now)) {
                // An earlier lock has expired: start counting afresh
                user.setLockedUntil(null);
                user.setFailedLoginAttempts(0);
            }
            int attempts = user.getFailedLoginAttempts() + 1;
            if (attempts >= securityProperties.getLockoutMaxAttempts()) {
                user.setLockedUntil(now.plus(Duration.ofMinutes(securityProperties.getLockoutDurationMinutes())));
                user.setFailedLoginAttempts(0);
                log.warn("Account {} locked for {} minutes after repeated failed logins",
                        user.getEmail(), securityProperties.getLockoutDurationMinutes());
            } else {
                user.setFailedLoginAttempts(attempts);
            }
            userRepository.save(user);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccess(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            if (user.getFailedLoginAttempts() != 0 || user.getLockedUntil() != null) {
                user.setFailedLoginAttempts(0);
                user.setLockedUntil(null);
                userRepository.save(user);
            }
        });
    }
}