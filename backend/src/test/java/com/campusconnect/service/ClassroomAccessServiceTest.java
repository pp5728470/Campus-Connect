package com.campusconnect.service;

import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.repository.ClassroomRepository;
import com.campusconnect.repository.EnrollmentRepository;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClassroomAccessServiceTest {

    @Mock private ClassroomRepository classroomRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @InjectMocks private ClassroomAccessService classroomAccessService;

    @BeforeEach
    void authenticate() {
        User user = User.builder().id(1L).email("t@college.edu").fullName("Teacher")
                .passwordHash("x").role(Role.TEACHER).build();
        UserPrincipal principal = new UserPrincipal(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void requireActiveClassroomRejectsArchivedClass() {
        Classroom classroom = Classroom.builder().id(9L).name("Archived DBMS").archived(true).build();
        when(classroomRepository.findById(9L)).thenReturn(Optional.of(classroom));

        assertThatThrownBy(() -> classroomAccessService.requireActiveClassroom(9L))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException api = (ApiException) ex;
                    assertThat(api.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(api.getMessage()).contains("archived");
                });
    }

    @Test
    void requireActiveClassroomAllowsOpenClass() {
        Classroom classroom = Classroom.builder().id(3L).name("Open").archived(false).build();
        when(classroomRepository.findById(3L)).thenReturn(Optional.of(classroom));

        assertThat(classroomAccessService.requireActiveClassroom(3L)).isSameAs(classroom);
    }
}
