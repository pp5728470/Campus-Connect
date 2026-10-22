package com.campusconnect.integration;

import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.NotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** End-to-end checks of the HTTP API against an in-memory H2 database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CampusConnectIntegrationTest {

    private static final String PASSWORD = "Password@123";

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private NotificationService notificationService;

    @Test
    void registerLoginAndCreateClassroom() throws Exception {
        String email = uniqueEmail("teacher");
        mvc.perform(json(post("/api/auth/register"), Map.of(
                        "fullName", "Dr. Ananya Krishnan", "email", email, "password", PASSWORD, "role", "TEACHER")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.active").value(true))
                .andExpect(jsonPath("$.accessToken").isNotEmpty());

        String token = login(email, PASSWORD);

        mvc.perform(get("/api/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("TEACHER"));

        mvc.perform(json(post("/api/classrooms").header("Authorization", bearer(token)), Map.of(
                        "name", "Advanced Java - MCA Sem II", "section", "A", "subject", "Advanced Java")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.myRole").value("TEACHER"))
                .andExpect(jsonPath("$.classCode").value(org.hamcrest.Matchers.hasLength(7)));

        mvc.perform(get("/api/classrooms").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Advanced Java - MCA Sem II"));
    }

    @Test
    void requestsWithoutTokenAreRejected() throws Exception {
        mvc.perform(get("/api/notifications")).andExpect(status().isForbidden());
    }

    @Test
    void accountLocksAfterFiveFailedLoginsEvenWithCorrectPassword() throws Exception {
        String email = uniqueEmail("lockout");
        register(email, "Rohan Deshmukh", "STUDENT");

        for (int i = 0; i < 5; i++) {
            mvc.perform(json(post("/api/auth/login"), Map.of("email", email, "password", "WrongPass1")))
                    .andExpect(status().isUnauthorized());
        }

        mvc.perform(json(post("/api/auth/login"), Map.of("email", email, "password", PASSWORD)))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.status").value(423))
                .andExpect(jsonPath("$.path").value("/api/auth/login"));

        User user = userRepository.findByEmail(email).orElseThrow();
        assertThat(user.getLockedUntil()).isAfter(Instant.now().plus(14, ChronoUnit.MINUTES));
    }

    @Test
    void successfulLoginResetsFailedAttemptCounter() throws Exception {
        String email = uniqueEmail("reset-counter");
        register(email, "Isha Patel", "STUDENT");

        for (int i = 0; i < 3; i++) {
            mvc.perform(json(post("/api/auth/login"), Map.of("email", email, "password", "WrongPass1")))
                    .andExpect(status().isUnauthorized());
        }
        assertThat(userRepository.findByEmail(email).orElseThrow().getFailedLoginAttempts()).isEqualTo(3);

        login(email, PASSWORD);

        assertThat(userRepository.findByEmail(email).orElseThrow().getFailedLoginAttempts()).isZero();
    }

    @Test
    void forgotPasswordAlwaysSucceedsAndResetFlowWorks() throws Exception {
        String email = uniqueEmail("forgot");
        register(email, "Meera Joshi", "STUDENT");

        mvc.perform(json(post("/api/auth/forgot-password"), Map.of("email", "nobody@college.edu")))
                .andExpect(status().isOk());
        mvc.perform(json(post("/api/auth/forgot-password"), Map.of("email", email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty());

        mvc.perform(json(post("/api/auth/reset-password"), Map.of("token", "not-a-real-token", "newPassword", "NewPass@456")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void changePasswordRequiresCurrentPasswordAndSwitchesCredentials() throws Exception {
        String email = uniqueEmail("change");
        String token = register(email, "Kabir Nair", "STUDENT");

        mvc.perform(json(post("/api/auth/change-password").header("Authorization", bearer(token)),
                        Map.of("currentPassword", "Incorrect1", "newPassword", "NewPass@456")))
                .andExpect(status().isBadRequest());

        mvc.perform(json(post("/api/auth/change-password").header("Authorization", bearer(token)),
                        Map.of("currentPassword", PASSWORD, "newPassword", "NewPass@456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());

        mvc.perform(json(post("/api/auth/login"), Map.of("email", email, "password", PASSWORD)))
                .andExpect(status().isUnauthorized());
        login(email, "NewPass@456");
    }

    @Test
    void adminEndpointsAreRestrictedToAdmins() throws Exception {
        String teacherToken = register(uniqueEmail("not-admin"), "Prof. Rajesh Iyer", "TEACHER");
        mvc.perform(get("/api/admin/stats").header("Authorization", bearer(teacherToken)))
                .andExpect(status().isForbidden());

        String adminEmail = uniqueEmail("admin");
        userRepository.save(User.builder()
                .fullName("Campus Administrator").email(adminEmail)
                .passwordHash(passwordEncoder.encode(PASSWORD)).role(Role.ADMIN).build());
        String adminToken = login(adminEmail, PASSWORD);

        mvc.perform(get("/api/admin/stats").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").isNumber())
                .andExpect(jsonPath("$.storageBytes").isNumber());

        mvc.perform(get("/api/admin/users").param("role", "ADMIN").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].role").value("ADMIN"));

        mvc.perform(get("/api/admin/classrooms").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0));
    }

    @Test
    void deactivatedUserCannotLoginAndReactivationRestoresAccess() throws Exception {
        String adminEmail = uniqueEmail("admin2");
        userRepository.save(User.builder()
                .fullName("Campus Administrator").email(adminEmail)
                .passwordHash(passwordEncoder.encode(PASSWORD)).role(Role.ADMIN).build());
        String adminToken = login(adminEmail, PASSWORD);

        String studentEmail = uniqueEmail("student");
        register(studentEmail, "Sneha Reddy", "STUDENT");
        Long studentId = userRepository.findByEmail(studentEmail).orElseThrow().getId();

        mvc.perform(patch("/api/admin/users/" + studentId + "/deactivate").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
        mvc.perform(json(post("/api/auth/login"), Map.of("email", studentEmail, "password", PASSWORD)))
                .andExpect(status().isForbidden());

        mvc.perform(patch("/api/admin/users/" + studentId + "/activate").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));
        login(studentEmail, PASSWORD);
    }

    @Test
    void classworkFlowProducesNotificationsGradebookCalendarAndSearch() throws Exception {
        String teacherToken = register(uniqueEmail("t"), "Dr. Ananya Krishnan", "TEACHER");
        String studentEmail = uniqueEmail("s");
        String studentToken = register(studentEmail, "Aarav Mehta", "STUDENT");

        JsonNode classroom = body(mvc.perform(json(post("/api/classrooms").header("Authorization", bearer(teacherToken)),
                Map.of("name", "Database Management Systems", "subject", "DBMS"))).andExpect(status().isCreated()));
        long classId = classroom.get("id").asLong();
        mvc.perform(json(post("/api/classrooms/join").header("Authorization", bearer(studentToken)),
                        Map.of("classCode", classroom.get("classCode").asText())))
                .andExpect(status().isOk());

        // Announcement and assignment notify the student, not the teacher who posted them
        mvc.perform(json(post("/api/classrooms/" + classId + "/announcements").header("Authorization", bearer(teacherToken)),
                Map.of("body", "Lab moves to Room 112 on Friday."))).andExpect(status().isCreated());
        Instant due = Instant.now().plus(2, ChronoUnit.DAYS);
        JsonNode assignment = body(mvc.perform(json(
                post("/api/classrooms/" + classId + "/assignments").header("Authorization", bearer(teacherToken)),
                Map.of("title", "SQL Practice Set", "maxPoints", 20, "dueAt", due.toString())))
                .andExpect(status().isCreated()));
        long assignmentId = assignment.get("id").asLong();

        mvc.perform(get("/api/notifications/unread-count").header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2));
        mvc.perform(get("/api/notifications/unread-count").header("Authorization", bearer(teacherToken)))
                .andExpect(jsonPath("$.count").value(0));

        // Grading notifies the student with a GRADED notification
        long studentId = userRepository.findByEmail(studentEmail).orElseThrow().getId();
        mvc.perform(json(post("/api/classrooms/" + classId + "/assignments/" + assignmentId
                        + "/submissions/" + studentId + "/grade").header("Authorization", bearer(teacherToken)),
                Map.of("grade", 17, "returnWork", false))).andExpect(status().isOk());

        mvc.perform(get("/api/notifications").param("unreadOnly", "true").header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content[0].type").value("GRADED"))
                .andExpect(jsonPath("$.content[0].link").value("/classes/" + classId + "/assignments/" + assignmentId));

        long firstId = body(mvc.perform(get("/api/notifications").header("Authorization", bearer(studentToken))))
                .get("content").get(0).get("id").asLong();
        mvc.perform(patch("/api/notifications/" + firstId + "/read").header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));
        mvc.perform(post("/api/notifications/read-all").header("Authorization", bearer(studentToken)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/notifications/unread-count").header("Authorization", bearer(studentToken)))
                .andExpect(jsonPath("$.count").value(0));

        // Gradebook: teacher only, 85% average for the single graded cell
        mvc.perform(get("/api/classrooms/" + classId + "/grades").header("Authorization", bearer(studentToken)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/classrooms/" + classId + "/grades").header("Authorization", bearer(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignments.length()").value(1))
                .andExpect(jsonPath("$.rows[0].studentName").value("Aarav Mehta"))
                .andExpect(jsonPath("$.rows[0].cells[0].grade").value(17))
                .andExpect(jsonPath("$.rows[0].averagePercent").value(85.0))
                .andExpect(jsonPath("$.classAveragePercent").value(85.0));

        mvc.perform(get("/api/classrooms/" + classId + "/grades/me").header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].status").value("GRADED"))
                .andExpect(jsonPath("$.averagePercent").value(85.0));

        mvc.perform(get("/api/classrooms/" + classId + "/grades/analytics").header("Authorization", bearer(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.distribution.length()").value(5))
                .andExpect(jsonPath("$.distribution[3].label").value("80-89"))
                .andExpect(jsonPath("$.distribution[3].count").value(1))
                .andExpect(jsonPath("$.assignments[0].submissionRate").value(100.0));

        mvc.perform(get("/api/classrooms/" + classId + "/grades/export/csv").header("Authorization", bearer(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("gradebook-" + classId + ".csv")));
        byte[] xlsx = mvc.perform(get("/api/classrooms/" + classId + "/grades/export/xlsx")
                        .header("Authorization", bearer(teacherToken)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(xlsx).startsWith((byte) 'P', (byte) 'K'); // xlsx files are zip archives

        // Calendar
        var dueMonth = due.atZone(ZoneOffset.UTC);
        mvc.perform(get("/api/calendar")
                        .param("year", String.valueOf(dueMonth.getYear()))
                        .param("month", String.valueOf(dueMonth.getMonthValue()))
                        .header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.assignmentId == " + assignmentId + ")].title").value("SQL Practice Set"));
        mvc.perform(get("/api/calendar").param("year", "2026").param("month", "13")
                        .header("Authorization", bearer(studentToken)))
                .andExpect(status().isBadRequest());

        // Search is limited to classes the user belongs to
        mvc.perform(get("/api/search").param("q", "practice").header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].type").value("ASSIGNMENT"))
                .andExpect(jsonPath("$.results[0].link").value("/classes/" + classId + "/assignments/" + assignmentId));
        String outsider = register(uniqueEmail("outsider"), "Vikram Singh", "STUDENT");
        mvc.perform(get("/api/search").param("q", "practice").header("Authorization", bearer(outsider)))
                .andExpect(jsonPath("$.results.length()").value(0));
    }

    @Test
    void dueReminderJobNotifiesPendingStudentsOnlyOncePerDay() throws Exception {
        String teacherToken = register(uniqueEmail("rt"), "Prof. Rajesh Iyer", "TEACHER");
        String pendingToken = register(uniqueEmail("rs1"), "Diya Sharma", "STUDENT");
        String doneEmail = uniqueEmail("rs2");
        String doneToken = register(doneEmail, "Kabir Nair", "STUDENT");

        JsonNode classroom = body(mvc.perform(json(post("/api/classrooms").header("Authorization", bearer(teacherToken)),
                Map.of("name", "Web Technologies Lab"))).andExpect(status().isCreated()));
        long classId = classroom.get("id").asLong();
        for (String token : new String[]{pendingToken, doneToken}) {
            mvc.perform(json(post("/api/classrooms/join").header("Authorization", bearer(token)),
                    Map.of("classCode", classroom.get("classCode").asText()))).andExpect(status().isOk());
        }

        long assignmentId = body(mvc.perform(json(
                post("/api/classrooms/" + classId + "/assignments").header("Authorization", bearer(teacherToken)),
                Map.of("title", "Responsive landing page", "maxPoints", 25,
                        "dueAt", Instant.now().plus(6, ChronoUnit.HOURS).toString())))
                .andExpect(status().isCreated())).get("id").asLong();
        mvc.perform(json(post("/api/classrooms/" + classId + "/assignments/" + assignmentId + "/submit")
                        .header("Authorization", bearer(doneToken)), Map.of("textAnswer", "CSS Grid layout done")))
                .andExpect(status().isOk());

        assertThat(notificationService.createDueReminders()).isEqualTo(1);
        assertThat(notificationService.createDueReminders()).isZero();

        mvc.perform(get("/api/notifications").header("Authorization", bearer(pendingToken)))
                .andExpect(jsonPath("$.content[?(@.type == 'DUE_TOMORROW')].title")
                        .value("Due soon: Responsive landing page"));
        mvc.perform(get("/api/notifications").header("Authorization", bearer(doneToken)))
                .andExpect(jsonPath("$.content[?(@.type == 'DUE_TOMORROW')]").isEmpty());
    }

    // --- helpers ---------------------------------------------------------------------------

    private String register(String email, String fullName, String role) throws Exception {
        JsonNode response = body(mvc.perform(json(post("/api/auth/register"), Map.of(
                        "fullName", fullName, "email", email, "password", PASSWORD, "role", role)))
                .andExpect(status().isCreated()));
        return response.get("accessToken").asText();
    }

    private String login(String email, String password) throws Exception {
        return body(mvc.perform(json(post("/api/auth/login"), Map.of("email", email, "password", password)))
                .andExpect(status().isOk())).get("accessToken").asText();
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder json(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder builder, Object payload
    ) throws Exception {
        return builder.contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(payload));
    }

    private JsonNode body(ResultActions actions) throws Exception {
        return objectMapper.readTree(actions.andReturn().getResponse().getContentAsString());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@college.edu";
    }
}
