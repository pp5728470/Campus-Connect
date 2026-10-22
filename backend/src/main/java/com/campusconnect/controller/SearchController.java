package com.campusconnect.controller;

import com.campusconnect.dto.search.SearchResponse;
import com.campusconnect.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Tag(name = "Search")
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    @Operation(summary = "Search my classes, assignments and materials")
    public SearchResponse search(@RequestParam(name = "q", defaultValue = "") String query) {
        return searchService.search(query);
    }
}
