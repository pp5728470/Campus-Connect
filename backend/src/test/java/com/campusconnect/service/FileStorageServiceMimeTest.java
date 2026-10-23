package com.campusconnect.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FileStorageServiceMimeTest {

    @Test
    void mimeForExtensionUsesTrustedMapNotClientValues() {
        assertThat(FileStorageService.mimeForExtension("pdf")).isEqualTo("application/pdf");
        assertThat(FileStorageService.mimeForExtension("PNG")).isEqualTo("image/png");
        assertThat(FileStorageService.mimeForExtension("docx"))
                .isEqualTo("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        assertThat(FileStorageService.mimeForExtension("exe")).isEqualTo("application/octet-stream");
        assertThat(FileStorageService.mimeForExtension("")).isEqualTo("application/octet-stream");
        assertThat(FileStorageService.mimeForExtension(null)).isEqualTo("application/octet-stream");
    }
}
