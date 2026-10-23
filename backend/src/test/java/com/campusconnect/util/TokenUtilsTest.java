package com.campusconnect.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TokenUtilsTest {

    @Test
    void sha256IsDeterministicHexDigest() {
        String hash = TokenUtils.sha256("refresh-token-value");
        assertThat(hash).hasSize(64).matches("[0-9a-f]{64}");
        assertThat(TokenUtils.sha256("refresh-token-value")).isEqualTo(hash);
        assertThat(TokenUtils.sha256("other")).isNotEqualTo(hash);
    }
}
