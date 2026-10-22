package com.campusconnect.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Hourly job that reminds students about assignments due within the next 24 hours. */
@Slf4j
@Component
@RequiredArgsConstructor
public class DueReminderJob {

    private final NotificationService notificationService;

    @Scheduled(cron = "${app.reminders.cron:0 0 * * * *}")
    public void sendDueReminders() {
        try {
            notificationService.createDueReminders();
        } catch (RuntimeException ex) {
            // A failed run must not stop future scheduled executions
            log.error("Due-date reminder job failed", ex);
        }
    }
}
