package com.campusconnect.integration;

import com.campusconnect.entity.RefreshToken;
import com.campusconnect.repository.RefreshTokenRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.util.TokenUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Covers file ACL, owned uploads, archived writes, hashed refresh tokens, MIME, and grade role checks. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityHardeningIntegrationTest {

    private static final String PASSWORD = "Password@123";

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;

    @Value("${server.forward-headers-strategy:}")
    private String forwardHeadersStrategy;

    @Test
    void forwardHeadersStrategyIsNativeForProxyIp() {
        // application.yml sets native so nginx X-Forwarded-For reaches request.getRemoteAddr()
        // (used by LoginRateLimitFilter) in Docker.
        assertThat(forwardHeadersStrategy).isEqualToIgnoringCase("native");
    }

    @Test
    void refreshTokenIsStoredAsSha256Hash() throws Exception {
        String email = uniqueEmail("hash-rt");
        JsonNode auth = body(mvc.perform(json(post("/api/auth/register"), Map.of(
                "fullName", "Hash Token", "email", email, "password", PASSWORD, "role", "STUDENT")))
                .andExpect(status().isCreated()));
        String rawRefresh = auth.get("refreshToken").asText();
        String hash = TokenUtils.sha256(rawRefresh);

        RefreshToken stored = refreshTokenRepository.findByToken(hash).orElseThrow();
        assertThat(stored.getToken()).isEqualTo(hash).isNotEqualTo(rawRefresh);

        mvc.perform(json(post("/api/auth/refresh"), Map.of("refreshToken", rawRefresh)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());

        // Plain-text stored in DB must not authenticate (lookup is by SHA-256)
        stored.setRevoked(false);
        stored.setToken(rawRefresh);
        refreshTokenRepository.save(stored);
        mvc.perform(json(post("/api/auth/refresh"), Map.of("refreshToken", rawRefresh)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void archivedClassBlocksWritesButAllowsReads() throws Exception {
        String teacherToken = register(uniqueEmail("arch-t"), "Dr. Archive", "TEACHER");
        String studentToken = register(uniqueEmail("arch-s"), "Stu Archive", "STUDENT");

        JsonNode classroom = body(mvc.perform(json(post("/api/classrooms").header("Authorization", bearer(teacherToken)),
                Map.of("name", "Archivable Class"))).andExpect(status().isCreated()));
        long classId = classroom.get("id").asLong();
        mvc.perform(json(post("/api/classrooms/join").header("Authorization", bearer(studentToken)),
                Map.of("classCode", classroom.get("classCode").asText()))).andExpect(status().isOk());

        long assignmentId = body(mvc.perform(json(
                post("/api/classrooms/" + classId + "/assignments").header("Authorization", bearer(teacherToken)),
                Map.of("title", "Before archive", "maxPoints", 10)))
                .andExpect(status().isCreated())).get("id").asLong();

        mvc.perform(post("/api/classrooms/" + classId + "/archive").header("Authorization", bearer(teacherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archived").value(true));

        mvc.perform(get("/api/classrooms/" + classId + "/assignments").header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk());

        mvc.perform(json(post("/api/classrooms/" + classId + "/assignments/" + assignmentId + "/submit")
                        .header("Authorization", bearer(studentToken)), Map.of("textAnswer", "too late")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("archived")));

        mvc.perform(json(post("/api/classrooms/" + classId + "/announcements")
                        .header("Authorization", bearer(teacherToken)), Map.of("body", "Nope")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submitRejectsFileNotUploadedByStudent() throws Exception {
        String teacherToken = register(uniqueEmail("own-t"), "Prof Own", "TEACHER");
        String studentToken = register(uniqueEmail("own-s"), "Stu Own", "STUDENT");
        String peerToken = register(uniqueEmail("own-p"), "Peer Own", "STUDENT");

        JsonNode classroom = body(mvc.perform(json(post("/api/classrooms").header("Authorization", bearer(teacherToken)),
                Map.of("name", "Ownership Class"))).andExpect(status().isCreated()));
        long classId = classroom.get("id").asLong();
        for (String token : new String[]{studentToken, peerToken}) {
            mvc.perform(json(post("/api/classrooms/join").header("Authorization", bearer(token)),
                    Map.of("classCode", classroom.get("classCode").asText()))).andExpect(status().isOk());
        }

        long assignmentId = body(mvc.perform(json(
                post("/api/classrooms/" + classId + "/assignments").header("Authorization", bearer(teacherToken)),
                Map.of("title", "Hand in", "maxPoints", 10)))
                .andExpect(status().isCreated())).get("id").asLong();

        long peerFileId = uploadPdf(classId, peerToken, "peer-notes.pdf");

        mvc.perform(json(post("/api/classrooms/" + classId + "/assignments/" + assignmentId + "/submit")
                        .header("Authorization", bearer(studentToken)),
                Map.of("fileIds", List.of(peerFileId))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("One or more files are invalid"));
    }

    @Test
    void teacherCannotAttachStudentFileToAnnouncement() throws Exception {
        String teacherToken = register(uniqueEmail("att-t"), "Prof Attach", "TEACHER");
        String studentToken = register(uniqueEmail("att-s"), "Stu Attach", "STUDENT");

        JsonNode classroom = body(mvc.perform(json(post("/api/classrooms").header("Authorization", bearer(teacherToken)),
                Map.of("name", "Attach Class"))).andExpect(status().isCreated()));
        long classId = classroom.get("id").asLong();
        mvc.perform(json(post("/api/classrooms/join").header("Authorization", bearer(studentToken)),
                Map.of("classCode", classroom.get("classCode").asText()))).andExpect(status().isOk());

        long studentFileId = uploadPdf(classId, studentToken, "student.pdf");

        mvc.perform(json(post("/api/classrooms/" + classId + "/announcements")
                        .header("Authorization", bearer(teacherToken)),
                Map.of("body", "See attached", "fileIds", List.of(studentFileId))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("One or more files are invalid"));
    }

    @Test
    void unattachedFileIsForbiddenToOtherStudentsAndDownloadUsesExtensionMime() throws Exception {
        String teacherToken = register(uniqueEmail("mime-t"), "Prof Mime", "TEACHER");
        String uploaderToken = register(uniqueEmail("mime-u"), "Uploader", "STUDENT");
        String otherToken = register(uniqueEmail("mime-o"), "Other", "STUDENT");

        JsonNode classroom = body(mvc.perform(json(post("/api/classrooms").header("Authorization", bearer(teacherToken)),
                Map.of("name", "Mime Class"))).andExpect(status().isCreated()));
        long classId = classroom.get("id").asLong();
        for (String token : new String[]{uploaderToken, otherToken}) {
            mvc.perform(json(post("/api/classrooms/join").header("Authorization", bearer(token)),
                    Map.of("classCode", classroom.get("classCode").asText()))).andExpect(status().isOk());
        }

        MockMultipartFile spoofed = new MockMultipartFile(
                "files", "report.pdf", "application/x-msdownload", "%PDF-1.4 fake".getBytes());
        JsonNode uploaded = body(mvc.perform(multipart("/api/classrooms/" + classId + "/files")
                        .file(spoofed)
                        .header("Authorization", bearer(uploaderToken)))
                .andExpect(status().isOk()));
        long fileId = uploaded.get(0).get("id").asLong();

        mvc.perform(get("/api/files/" + fileId).header("Authorization", bearer(otherToken)))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/files/" + fileId + "/download").header("Authorization", bearer(uploaderToken)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"));
    }

    @Test
    void gradingNonStudentEnrollmentIsRejected() throws Exception {
        String teacherEmail = uniqueEmail("grade-t");
        String teacherToken = register(teacherEmail, "Prof Grade", "TEACHER");

        JsonNode classroom = body(mvc.perform(json(post("/api/classrooms").header("Authorization", bearer(teacherToken)),
                Map.of("name", "Grade Class"))).andExpect(status().isCreated()));
        long classId = classroom.get("id").asLong();
        long ownerId = userRepository.findByEmail(teacherEmail).orElseThrow().getId();

        long assignmentId = body(mvc.perform(json(
                post("/api/classrooms/" + classId + "/assignments").header("Authorization", bearer(teacherToken)),
                Map.of("title", "Quiz", "maxPoints", 10)))
                .andExpect(status().isCreated())).get("id").asLong();

        // Owner is enrolled as TEACHER — grading them must fail
        mvc.perform(json(post("/api/classrooms/" + classId + "/assignments/" + assignmentId
                        + "/submissions/" + ownerId + "/grade").header("Authorization", bearer(teacherToken)),
                Map.of("grade", 5, "returnWork", false)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("students")));
    }

    private long uploadPdf(long classId, String token, String filename) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "files", filename, "application/pdf", "%PDF-1.4 content".getBytes());
        JsonNode uploaded = body(mvc.perform(multipart("/api/classrooms/" + classId + "/files")
                        .file(file)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk()));
        return uploaded.get(0).get("id").asLong();
    }

    private String register(String email, String fullName, String role) throws Exception {
        return body(mvc.perform(json(post("/api/auth/register"), Map.of(
                        "fullName", fullName, "email", email, "password", PASSWORD, "role", role)))
                .andExpect(status().isCreated())).get("accessToken").asText();
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
