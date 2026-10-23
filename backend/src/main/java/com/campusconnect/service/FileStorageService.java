package com.campusconnect.service;

import com.campusconnect.config.UploadProperties;
import com.campusconnect.dto.file.FileResponse;
import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.StoredFile;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.mapper.FileMapper;
import com.campusconnect.repository.StoredFileRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.SecurityUtils;
import com.campusconnect.security.UserPrincipal;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
            "png", "jpg", "jpeg", "gif", "webp", "zip"
    );

    /** Trusted MIME map keyed by lowercase extension (never trust the client Content-Type). */
    private static final Map<String, String> EXTENSION_MIME_TYPES = Map.ofEntries(
            Map.entry("pdf", "application/pdf"),
            Map.entry("doc", "application/msword"),
            Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            Map.entry("ppt", "application/vnd.ms-powerpoint"),
            Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            Map.entry("xls", "application/vnd.ms-excel"),
            Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            Map.entry("png", "image/png"),
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("gif", "image/gif"),
            Map.entry("webp", "image/webp"),
            Map.entry("zip", "application/zip")
    );

    private final UploadProperties uploadProperties;
    private final StoredFileRepository storedFileRepository;
    private final UserRepository userRepository;
    private final ClassroomAccessService classroomAccessService;
    private final FileMapper fileMapper;

    private Path rootDir;

    @PostConstruct
    void init() throws IOException {
        rootDir = Path.of(uploadProperties.getDir()).toAbsolutePath().normalize();
        Files.createDirectories(rootDir);
    }

    @Transactional
    public StoredFile store(Long classroomId, MultipartFile multipartFile) {
        classroomAccessService.requireActiveClassroom(classroomId);
        classroomAccessService.requireMembership(classroomId);
        validate(multipartFile);

        Classroom classroom = classroomAccessService.requireClassroom(classroomId);
        User uploader = userRepository.findById(SecurityUtils.currentUser().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        String originalName = Objects.requireNonNullElse(multipartFile.getOriginalFilename(), "file");
        String extension = extensionOf(originalName).toLowerCase(Locale.ROOT);
        String storedName = UUID.randomUUID().toString().replace("-", "") + (extension.isEmpty() ? "" : "." + extension);

        try {
            Path target = rootDir.resolve(storedName);
            Files.copy(multipartFile.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file");
        }

        StoredFile storedFile = StoredFile.builder()
                .classroom(classroom)
                .uploadedBy(uploader)
                .storedName(storedName)
                .originalName(originalName)
                .contentType(mimeForExtension(extension))
                .sizeBytes(multipartFile.getSize())
                .build();

        return storedFileRepository.save(storedFile);
    }

    @Transactional
    public List<StoredFile> storeMany(Long classroomId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }
        return files.stream()
                .filter(f -> f != null && !f.isEmpty())
                .map(f -> store(classroomId, f))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StoredFile> resolveForClassroom(Long classroomId, Collection<Long> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) {
            return List.of();
        }
        List<StoredFile> files = storedFileRepository.findByIdInAndClassroomId(fileIds, classroomId);
        if (files.size() != new HashSet<>(fileIds).size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "One or more files are invalid for this class");
        }
        return files;
    }

    /**
     * Resolves class files and requires every one to have been uploaded by {@code uploaderId}.
     */
    @Transactional(readOnly = true)
    public List<StoredFile> resolveOwnedForClassroom(Long classroomId, Collection<Long> fileIds, Long uploaderId) {
        List<StoredFile> files = resolveForClassroom(classroomId, fileIds);
        boolean allOwned = files.stream().allMatch(f -> f.getUploadedBy().getId().equals(uploaderId));
        if (!allOwned) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "One or more files are invalid");
        }
        return files;
    }

    @Transactional(readOnly = true)
    public FileResponse getMetadata(Long fileId) {
        StoredFile file = storedFileRepository.findById(fileId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "File not found"));
        requireCanAccessFile(file);
        return fileMapper.toResponse(file);
    }

    @Transactional(readOnly = true)
    public Resource loadAsResource(Long fileId) {
        StoredFile file = storedFileRepository.findById(fileId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "File not found"));
        requireCanAccessFile(file);

        try {
            Path path = rootDir.resolve(file.getStoredName()).normalize();
            if (!path.startsWith(rootDir) || !Files.exists(path)) {
                throw new ApiException(HttpStatus.NOT_FOUND,
                        "This file is missing on the server. Re-upload it or start the backend with the dev profile after seeding.");
            }
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ApiException(HttpStatus.NOT_FOUND,
                        "This file is missing on the server. Re-upload it or start the backend with the dev profile after seeding.");
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read file");
        }
    }

    /**
     * Teachers/ADMIN: any file in the class.
     * Submission attachments: owning student (or teacher via rule above).
     * Announcement/material/assignment attachments: any class member.
     * Unattached files: uploader only.
     */
    @Transactional(readOnly = true)
    public boolean canAccessFile(StoredFile file) {
        UserPrincipal principal = SecurityUtils.currentUser();
        Long classroomId = file.getClassroom().getId();

        try {
            classroomAccessService.requireMembership(classroomId);
        } catch (ApiException ex) {
            return false;
        }

        if (classroomAccessService.isTeacherInClass(classroomId) || principal.getRole() == Role.ADMIN) {
            return true;
        }

        if (storedFileRepository.isAttachedToSubmission(file.getId())) {
            return storedFileRepository.findSubmissionOwnerIdByFileId(file.getId())
                    .map(ownerId -> ownerId.equals(principal.getId()))
                    .orElse(false);
        }

        if (storedFileRepository.isAttachedToClassContent(file.getId())) {
            return true;
        }

        return file.getUploadedBy().getId().equals(principal.getId());
    }

    private void requireCanAccessFile(StoredFile file) {
        if (!canAccessFile(file)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have access to this file");
        }
    }

    @Transactional(readOnly = true)
    public StoredFile requireFile(Long fileId) {
        return storedFileRepository.findById(fileId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "File not found"));
    }

    public String contentDisposition(Long fileId) {
        StoredFile file = requireFile(fileId);
        return "attachment; filename=\"" + file.getOriginalName().replace("\"", "") + "\"";
    }

    /** Response Content-Type is derived from the file extension, not the client-supplied MIME. */
    public String contentType(Long fileId) {
        StoredFile file = requireFile(fileId);
        String ext = extensionOf(file.getOriginalName()).toLowerCase(Locale.ROOT);
        return mimeForExtension(ext);
    }

    public static String mimeForExtension(String extension) {
        if (extension == null || extension.isBlank()) {
            return "application/octet-stream";
        }
        return EXTENSION_MIME_TYPES.getOrDefault(extension.toLowerCase(Locale.ROOT), "application/octet-stream");
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File is required");
        }
        if (file.getSize() > uploadProperties.getMaxFileSizeBytes()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File exceeds the 25 MB limit");
        }
        String originalName = Objects.requireNonNullElse(file.getOriginalFilename(), "");
        String ext = extensionOf(originalName).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Unsupported file type. Allowed: PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, images, ZIP");
        }
    }

    private String extensionOf(String filename) {
        int idx = filename.lastIndexOf('.');
        if (idx < 0 || idx == filename.length() - 1) {
            return "";
        }
        return filename.substring(idx + 1);
    }

    public List<FileResponse> toResponses(Collection<StoredFile> files) {
        return files.stream()
                .sorted(Comparator.comparing(StoredFile::getOriginalName, String.CASE_INSENSITIVE_ORDER))
                .map(fileMapper::toResponse)
                .collect(Collectors.toList());
    }
}
