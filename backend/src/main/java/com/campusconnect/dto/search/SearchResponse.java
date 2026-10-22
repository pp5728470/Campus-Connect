package com.campusconnect.dto.search;

import java.util.List;

public record SearchResponse(String query, List<SearchResultResponse> results) {
}