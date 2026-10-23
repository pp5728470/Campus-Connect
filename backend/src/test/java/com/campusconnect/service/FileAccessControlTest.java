package com.campusconnect.service;

import com.campusconnect.config.UploadProperties;
import com.campusconnect.entity.ClassRole;
import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.Enrollment;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.StoredFile;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.mapper.FileMapper;
import com.campusconnect.repository.StoredFileRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileAccessControlTest {

    @Mock private UploadProperties uploadProperties;
    @Mock private StoredFileRepository storedFileRepository;
    @Mock private UserRepository userRepository;
    @Mock private ClassroomAccessService classroomAccessService;
    @Mock private FileMapper fileMapper;
    @InjectMocks private FileStorageService fileStorageService;

    private User student;
    private User peer;
    private Classroom classroom;
    private StoredFile file;

    @BeforeEach
    void setUp() {
        student = User.builder().id(10L).email("s@college.edu").fullName("Student")
                .passwordHash("x").role(Role.STUDENT).build();
        peer = User.builder().id(11L).email("p@college.edu").fullName("Peer")
                .passwordHash("x").role(Role.STUDENT).build();
        classroom = Classroom.builder().id(5L).name("Java").archived(false).build();
        file = StoredFile.builder()
                .id(100L)
                .classroom(classroom)
                .uploadedBy(student)
                .storedName("abc.pdf")
                .originalName("notes.pdf")
                .contentType("application/octet-stream")
                .sizeBytes(12L)
                .build();

        authenticate(student);
        lenient().when(classroomAccessService.requireMembership(5L)).thenReturn(
                Enrollment.builder().classroom(classroom).user(student).roleInClass(ClassRole.STUDENT).build());
        lenient().when(classroomAccessService.isTeacherInClass(5L)).thenReturn(false);
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void uploaderCanAccessUnattachedFile() {
        when(storedFileRepository.isAttachedToSubmission(100L)).thenReturn(false);
        when(storedFileRepository.isAttachedToClassContent(100L)).thenReturn(false);

        assertThat(fileStorageService.canAccessFile(file)).isTrue();
    }

    @Test
    void peerCannotAccessUnattachedFile() {
        authenticate(peer);
        when(storedFileRepository.isAttachedToSubmission(100L)).thenReturn(false);
        when(storedFileRepository.isAttachedToClassContent(100L)).thenReturn(false);

        assertThat(fileStorageService.canAccessFile(file)).isFalse();
    }

    @Test
    void classMemberCanAccessAnnouncementAttachment() {
        authenticate(peer);
        when(storedFileRepository.isAttachedToSubmission(100L)).thenReturn(false);
        when(storedFileRepository.isAttachedToClassContent(100L)).thenReturn(true);

        assertThat(fileStorageService.canAccessFile(file)).isTrue();
    }

    @Test
    void onlySubmissionOwnerAmongStudentsCanAccessSubmissionFile() {
        authenticate(peer);
        when(storedFileRepository.isAttachedToSubmission(100L)).thenReturn(true);
        when(storedFileRepository.findSubmissionOwnerIdByFileId(100L)).thenReturn(Optional.of(10L));

        assertThat(fileStorageService.canAccessFile(file)).isFalse();

        authenticate(student);
        assertThat(fileStorageService.canAccessFile(file)).isTrue();
    }

    @Test
    void teacherCanAccessAnyClassFile() {
        User teacher = User.builder().id(1L).email("t@college.edu").fullName("Teacher")
                .passwordHash("x").role(Role.TEACHER).build();
        authenticate(teacher);
        when(classroomAccessService.isTeacherInClass(5L)).thenReturn(true);

        assertThat(fileStorageService.canAccessFile(file)).isTrue();
    }

    @Test
    void resolveOwnedRejectsFilesUploadedBySomeoneElse() {
        StoredFile foreign = StoredFile.builder()
                .id(101L)
                .classroom(classroom)
                .uploadedBy(peer)
                .storedName("other.pdf")
                .originalName("other.pdf")
                .contentType("application/pdf")
                .sizeBytes(1L)
                .build();
        when(storedFileRepository.findByIdInAndClassroomId(List.of(101L), 5L)).thenReturn(List.of(foreign));

        assertThatThrownBy(() -> fileStorageService.resolveOwnedForClassroom(5L, List.of(101L), student.getId()))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException api = (ApiException) ex;
                    assertThat(api.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(api.getMessage()).isEqualTo("One or more files are invalid");
                });
    }

    private void authenticate(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}
