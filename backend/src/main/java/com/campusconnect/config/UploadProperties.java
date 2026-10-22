package com.campusconnect.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.upload")
public class UploadProperties {
    private String dir = "./uploads";
    private long maxFileSizeBytes = 25L * 1024 * 1024;
}
