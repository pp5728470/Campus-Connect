package com.campusconnect.controller;

import com.campusconnect.dto.calendar.CalendarEventResponse;
import com.campusconnect.service.CalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
@Tag(name = "Calendar")
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping
    @Operation(summary = "Assignment due dates for a month across my classes")
    public List<CalendarEventResponse> dueDates(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) String zone
    ) {
        return calendarService.dueDates(year, month, zone);
    }
}
