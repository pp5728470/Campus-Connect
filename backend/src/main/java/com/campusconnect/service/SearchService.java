package com.campusconnect.service;

import com.campusconnect.dto.search.SearchResponse;
import com.campusconnect.dto.search.SearchResultResponse;
import com.campusconnect.dto.search.SearchResultType;
import com.campusconnect.entity.Enrollment;
import com.campusconnect.repository.AssignmentRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.MaterialRepository;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.util.LikePattern;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/** Searches classes, assignments and materials, limited to classes the current user belongs to. */
@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int MIN_QUERY_LENGTH = 2;
    private static final int MAX_QUERY_LENGTH = 100;
    private static final int LIMIT_PER_TYPE = 10;

    private final EnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final MaterialRepository materialRepository;

    @Transactional(readOnly = true)
    public SearchResponse search(String query) {
        String term = query == null ? "" : query.trim();
        if (term.length() < MIN_QUERY_LENGTH) {
            return new SearchResponse(term, List.of());
        }
        if (term.length() > MAX_QUERY_LENGTH) {
            term = term.substring(0, MAX_QUERY_LENGTH);
        }

        List<Enrollment> enrollments = enrollmentRepository.findActiveByUserId(SecurityUtils.currentUser().getId());
        if (enrollments.isEmpty()) {
            return new SearchResponse(term, List.of());
        }

        String needle = term.toLowerCase(Locale.ROOT);
        String pattern = LikePattern.contains(term);
        Set<Long> classroomIds = enrollments.stream().map(e -> e.getClassroom().getId()).collect(Collectors.toSet());
        Pageable limit = PageRequest.of(0, LIMIT_PER_TYPE);

        List<SearchResultResponse> results = new ArrayList<>();

        enrollments.stream()
                .filter(e -> matchesClass(e, needle))
                .limit(LIMIT_PER_TYPE)
                .forEach(e -> results.add(new SearchResultResponse(
                        SearchResultType.CLASS,
                        e.getClassroom().getId(),
                        e.getClassroom().getName(),
                        subtitle(e.getClassroom().getSubject(), e.getClassroom().getSection()),
                        e.getClassroom().getId(),
                        NotificationService.classLink(e.getClassroom().getId(), "stream")
                )));

        assignmentRepository.searchByTitle(classroomIds, pattern, limit).forEach(a -> results.add(
                new SearchResultResponse(
                        SearchResultType.ASSIGNMENT,
                        a.getId(),
                        a.getTitle(),
                        a.getClassroom().getName(),
                        a.getClassroom().getId(),
                        NotificationService.assignmentLink(a.getClassroom().getId(), a.getId())
                )));

        materialRepository.searchByTitle(classroomIds, pattern, limit).forEach(m -> results.add(
                new SearchResultResponse(
                        SearchResultType.MATERIAL,
                        m.getId(),
                        m.getTitle(),
                        m.getClassroom().getName(),
                        m.getClassroom().getId(),
                        NotificationService.classLink(m.getClassroom().getId(), "materials")
                )));

        return new SearchResponse(term, results);
    }

    private boolean matchesClass(Enrollment enrollment, String needle) {
        return contains(enrollment.getClassroom().getName(), needle)
                || contains(enrollment.getClassroom().getSubject(), needle)
                || contains(enrollment.getClassroom().getSection(), needle);
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }

    private String subtitle(String subject, String section) {
        if (subject != null && section != null) {
            return subject + " - Section " + section;
        }
        if (subject != null) {
            return subject;
        }
        return section != null ? "Section " + section : null;
    }
}
