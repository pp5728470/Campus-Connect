package com.campusconnect.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ClassCodeGeneratorTest {

    private final ClassCodeGenerator generator = new ClassCodeGenerator();

    @Test
    void generatesSevenCharacterCodesWithoutAmbiguousCharacters() {
        for (int i = 0; i < 200; i++) {
            assertThat(generator.generate())
                    .hasSize(7)
                    .matches("[A-HJ-NP-Z2-9]{7}");
        }
    }
}