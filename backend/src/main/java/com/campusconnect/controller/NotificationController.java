package com.campusconnect.controller;

import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.dto.notification.NotificationResponse;
import com.campusconnect.dto.notification.UnreadCountResponse;
import com.campusconnect.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "List my notifications, newest first")
    public PageResponse<NotificationResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly
    ) {
        return notificationService.list(page, size, unreadOnly);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Number of unread notifications")
    public UnreadCountResponse unreadCount() {
        return notificationService.unreadCount();
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark one notification as read")
    public NotificationResponse markRead(@PathVariable Long id) {
        return notificationService.markRead(id);
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Mark all notifications as read")
    public void markAllRead() {
        notificationService.markAllRead();
    }
}
