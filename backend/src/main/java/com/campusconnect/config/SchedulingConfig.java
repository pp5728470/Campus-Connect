package com.campusconnect.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Enables {@code @Scheduled} jobs such as the due-date reminder. */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
