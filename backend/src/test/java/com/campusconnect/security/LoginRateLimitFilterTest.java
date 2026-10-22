package com.campusconnect.security;

import com.campusconnect.config.SecurityProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRateLimitFilterTest {

    private LoginRateLimitFilter filterWithLimit(int perMinute) {
        SecurityProperties properties = new SecurityProperties();
        properties.setLoginRateLimitPerMinute(perMinute);
        return new LoginRateLimitFilter(properties, new ObjectMapper().registerModule(new JavaTimeModule()));
    }

    private MockHttpServletResponse login(LoginRateLimitFilter filter, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    void blocksRequestsOverTheLimitWithRetryAfter() throws Exception {
        LoginRateLimitFilter filter = filterWithLimit(2);

        assertThat(login(filter, "10.0.0.1").getStatus()).isEqualTo(200);
        assertThat(login(filter, "10.0.0.1").getStatus()).isEqualTo(200);

        MockHttpServletResponse blocked = login(filter, "10.0.0.1");
        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isNotNull();
        assertThat(blocked.getContentAsString()).contains("\"status\":429").contains("/api/auth/login");
    }

    @Test
    void limitsEachClientIpIndependently() throws Exception {
        LoginRateLimitFilter filter = filterWithLimit(1);

        assertThat(login(filter, "10.0.0.1").getStatus()).isEqualTo(200);
        assertThat(login(filter, "10.0.0.1").getStatus()).isEqualTo(429);
        assertThat(login(filter, "10.0.0.2").getStatus()).isEqualTo(200);
    }

    @Test
    void ignoresOtherEndpoints() throws Exception {
        LoginRateLimitFilter filter = filterWithLimit(1);

        for (int i = 0; i < 3; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/classrooms");
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, new MockFilterChain());
            assertThat(response.getStatus()).isEqualTo(200);
        }
    }
}