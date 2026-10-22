package com.campusconnect.service;

import com.campusconnect.config.SecurityProperties;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class LoginAttemptServiceTest {

    @Mock
    private UserRepository userRepository;

    private LoginAttemptService service;
    private User user;

    @BeforeEach
    void setUp() {
        SecurityProperties properties = new SecurityProperties();
        properties.setLockoutMaxAttempts(5);
        properties.setLockoutDurationMinutes(15);
        service = new LoginAttemptService(userRepository, properties);

        user = User.builder().id(7L).email("aarav@student.college.edu").fullName("Aarav Mehta")
                .passwordHash("x").role(Role.STUDENT).build();
    }

    @Test
    void failuresBelowThresholdOnlyIncrementCounter() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        for (int i = 0; i < 4; i++) {
            service.recordFailure(7L);
        }

        assertThat(user.getFailedLoginAttempts()).isEqualTo(4);
        assertThat(user.getLockedUntil()).isNull();
    }

    @Test
    void fifthFailureLocksAccountForFifteenMinutes() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        Instant before = Instant.now();

        for (int i = 0; i < 5; i++) {
            service.recordFailure(7L);
        }

        assertThat(user.getLockedUntil())
                .isAfter(before.plus(14, ChronoUnit.MINUTES))
                .isBefore(Instant.now().plus(16, ChronoUnit.MINUTES));
        assertThat(user.getFailedLoginAttempts()).isZero();
    }

    @Test
    void expiredLockStartsCountingFromZero() {
        user.setLockedUntil(Instant.now().minusSeconds(60));
        user.setFailedLoginAttempts(0);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        service.recordFailure(7L);

        assertThat(user.getLockedUntil()).isNull();
        assertThat(user.getFailedLoginAttempts()).isEqualTo(1);
    }

    @Test
    void successClearsCounterAndLock() {
        user.setFailedLoginAttempts(3);
        user.setLockedUntil(Instant.now().minusSeconds(5));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        service.recordSuccess(7L);

        assertThat(user.getFailedLoginAttempts()).isZero();
        assertThat(user.getLockedUntil()).isNull();
        verify(userRepository).save(user);
    }

    @Test
    void successWithCleanStateDoesNotWrite() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        service.recordSuccess(7L);

        verify(userRepository, never()).save(any());
    }

    @Test
    void lockedAccountIsRejectedWithLockedStatus() {
        user.setLockedUntil(Instant.now().plus(10, ChronoUnit.MINUTES));

        assertThatThrownBy(() -> service.assertCanLogin(user))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.LOCKED));
    }

    @Test
    void deactivatedAccountIsRejectedWithForbiddenStatus() {
        user.setActive(false);

        assertThatThrownBy(() -> service.assertCanLogin(user))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void expiredLockAllowsLogin() {
        user.setLockedUntil(Instant.now().minusSeconds(1));

        service.assertCanLogin(user);
    }
}