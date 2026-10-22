package com.campusconnect.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** General application settings ({@code app.*}). */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    /** Base URL of the web client, used when building links sent to users (e.g. password reset). */
    private String frontendUrl = "http://localhost:5173";
}
