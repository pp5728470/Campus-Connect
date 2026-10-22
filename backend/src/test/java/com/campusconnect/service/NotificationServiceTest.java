package com.campusconnect.service;

import com.campusconnect.entity.ClassRole;
import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.Enrollment;
import com.campusconnect.entity.Notification;
import com.campusconnect.entity.NotificationType;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.AssignmentRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.NotificationRepository;
import com.campusconnect.repository.SubmissionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private AssignmentRepository assignmentRepository;
    @Mock private SubmissionRepository submissionRepository;

    @Test
    @SuppressWarnings("unchecked")
    void notifyClassMembersSkipsTheActorAndReachesEveryoneElse() {
        Classroom classroom = Classroom.builder().id(1L).name("Advanced Java - MCA Sem II").build();
        User teacher = user(1L, "Dr. Ananya Krishnan", Role.TEACHER);
        User aarav = user(3L, "Aarav Mehta", Role.STUDENT);
        User diya = user(4L, "Diya Sharma", Role.STUDENT);
        when(enrollmentRepository.findPeopleByClassroomId(1L)).thenReturn(List.of(
                enrollment(classroom, teacher, ClassRole.TEACHER),
                enrollment(classroom, aarav, ClassRole.STUDENT),
                enrollment(classroom, diya, ClassRole.STUDENT)));

        NotificationService service = new NotificationService(
                notificationRepository, enrollmentRepository, assignmentRepository, submissionRepository);
        service.notifyClassMembers(1L, 1L, NotificationType.ANNOUNCEMENT, "New announcement", "Lab moved", "/classes/1/stream");

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue())
                .extracting(n -> n.getUser().getId())
                .containsExactlyInAnyOrder(3L, 4L);
        assertThat(captor.getValue())
                .allSatisfy(n -> {
                    assertThat(n.getType()).isEqualTo(NotificationType.ANNOUNCEMENT);
                    assertThat(n.getLink()).isEqualTo("/classes/1/stream");
                    assertThat(n.isRead()).isFalse();
                });
    }

    private User user(Long id, String name, Role role) {
        return User.builder().id(id).fullName(name).email(name.toLowerCase().replace(' ', '.') + "@college.edu")
                .passwordHash("x").role(role).build();
    }

    private Enrollment enrollment(Classroom classroom, User user, ClassRole role) {
        return Enrollment.builder().classroom(classroom).user(user).roleInClass(role).build();
    }
}