package com.campusconnect.service;

import com.campusconnect.dto.announcement.*;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.entity.*;
import com.campusconnect.exception.ApiException;
import com.campusconnect.repository.AnnouncementCommentRepository;
import com.campusconnect.repository.AnnouncementRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ClassroomAccessService classroomAccessService;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<AnnouncementResponse> list(Long classroomId, int page, int size) {
        classroomAccessService.requireMembership(classroomId);
        List<AnnouncementResponse> all = announcementRepository.findAllForClassroom(classroomId).stream()
                .sorted(Comparator
                        .comparing(Announcement::isPinned).reversed()
                        .thenComparing(Announcement::getCreatedAt, Comparator.reverseOrder()))
                .map(this::toResponse)
                .toList();
        return pageOf(all, page, size);
    }

    @Transactional
    public AnnouncementResponse create(Long classroomId, CreateAnnouncementRequest request) {
        classroomAccessService.requireTeacher(classroomId);
        User author = currentUserEntity();
        Classroom classroom = classroomAccessService.requireClassroom(classroomId);

        Announcement announcement = Announcement.builder()
                .classroom(classroom)
                .author(author)
                .body(request.body().trim())
                .pinned(Boolean.TRUE.equals(request.pinned()))
                .attachments(new HashSet<>(fileStorageService.resolveForClassroom(classroomId, request.fileIds())))
                .build();
        announcementRepository.save(announcement);
        notificationService.notifyClassMembers(
                classroomId,
                author.getId(),
                NotificationType.ANNOUNCEMENT,
                "New announcement in " + classroom.getName(),
                preview(announcement.getBody()),
                NotificationService.classLink(classroomId, "stream")
        );
        return toResponse(announcement);
    }

    @Transactional
    public AnnouncementResponse setPinned(Long classroomId, Long announcementId, boolean pinned) {
        classroomAccessService.requireTeacher(classroomId);
        Announcement announcement = requireAnnouncement(classroomId, announcementId);
        announcement.setPinned(pinned);
        return toResponse(announcement);
    }

    @Transactional
    public void delete(Long classroomId, Long announcementId) {
        classroomAccessService.requireTeacher(classroomId);
        Announcement announcement = requireAnnouncement(classroomId, announcementId);
        announcementRepository.delete(announcement);
    }

    @Transactional
    public CommentResponse addComment(Long classroomId, Long announcementId, CommentRequest request) {
        classroomAccessService.requireMembership(classroomId);
        Announcement announcement = requireAnnouncement(classroomId, announcementId);
        User author = currentUserEntity();

        AnnouncementComment comment = AnnouncementComment.builder()
                .announcement(announcement)
                .author(author)
                .body(request.body().trim())
                .build();
        commentRepository.save(comment);
        announcement.getComments().add(comment);
        return toCommentResponse(comment);
    }

    @Transactional
    public void deleteComment(Long classroomId, Long announcementId, Long commentId) {
        Enrollment enrollment = classroomAccessService.requireMembership(classroomId);
        Announcement announcement = requireAnnouncement(classroomId, announcementId);
        AnnouncementComment comment = commentRepository.findByIdAndAnnouncementId(commentId, announcement.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comment not found"));

        UserPrincipal principal = SecurityUtils.currentUser();
        boolean isAuthor = comment.getAuthor().getId().equals(principal.getId());
        boolean isTeacher = enrollment.getRoleInClass() == ClassRole.TEACHER;
        if (!isAuthor && !isTeacher) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only delete your own comments");
        }
        announcement.getComments().remove(comment);
        commentRepository.delete(comment);
    }

    private Announcement requireAnnouncement(Long classroomId, Long announcementId) {
        return announcementRepository.findByIdAndClassroomId(announcementId, classroomId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Announcement not found"));
    }

    private String preview(String text) {
        return text.length() <= 140 ? text : text.substring(0, 139) + "\u2026";
    }

    private User currentUserEntity() {
        return userRepository.findById(SecurityUtils.currentUser().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private AnnouncementResponse toResponse(Announcement announcement) {
        // Force-load attachments and comments
        announcement.getAttachments().size();
        announcement.getComments().size();
        return new AnnouncementResponse(
                announcement.getId(),
                announcement.getClassroom().getId(),
                announcement.getAuthor().getId(),
                announcement.getAuthor().getFullName(),
                announcement.getBody(),
                announcement.isPinned(),
                fileStorageService.toResponses(announcement.getAttachments()),
                announcement.getComments().stream().map(this::toCommentResponse).toList(),
                announcement.getCreatedAt(),
                announcement.getUpdatedAt()
        );
    }

    private CommentResponse toCommentResponse(AnnouncementComment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getFullName(),
                comment.getBody(),
                comment.getCreatedAt()
        );
    }

    private <T> PageResponse<T> pageOf(List<T> all, int page, int size) {
        int from = Math.min(page * size, all.size());
        int to = Math.min(from + size, all.size());
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) all.size() / size);
        return new PageResponse<>(all.subList(from, to), page, size, all.size(), totalPages,
                page >= totalPages - 1 || all.isEmpty());
    }
}
