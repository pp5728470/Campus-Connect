package com.campusconnect.security;

import com.campusconnect.config.SecurityProperties;
import com.campusconnect.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Throttles POST /api/auth/login per client IP using an in-memory token bucket. */
@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    static final String LOGIN_PATH = "/api/auth/login";
    private static final int CLEANUP_THRESHOLD = 10_000;

    private final int limitPerMinute;
    private final ObjectMapper objectMapper;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public LoginRateLimitFilter(SecurityProperties securityProperties, ObjectMapper objectMapper) {
        this.limitPerMinute = Math.max(1, securityProperties.getLoginRateLimitPerMinute());
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !(HttpMethod.POST.matches(request.getMethod()) && LOGIN_PATH.equals(request.getRequestURI()));
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        ConsumptionProbe probe = bucketFor(request.getRemoteAddr()).tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            filterChain.doFilter(request, response);
            return;
        }

        long retryAfterSeconds = Math.max(1, Duration.ofNanos(probe.getNanosToWaitForRefill()).plusSeconds(1).toSeconds());
        HttpStatus status = HttpStatus.TOO_MANY_REQUESTS;
        response.setStatus(status.value());
        response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfterSeconds));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), new ErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                "Too many login attempts. Try again in " + retryAfterSeconds + " seconds.",
                request.getRequestURI()
        ));
    }

    private Bucket bucketFor(String clientIp) {
        if (buckets.size() > CLEANUP_THRESHOLD) {
            // Idle clients have a full bucket; dropping them loses no throttling state
            buckets.values().removeIf(bucket -> bucket.getAvailableTokens() >= limitPerMinute);
        }
        return buckets.computeIfAbsent(clientIp, ip -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(limitPerMinute)
                        .refillIntervally(limitPerMinute, Duration.ofMinutes(1))
                        .build())
                .build());
    }
}