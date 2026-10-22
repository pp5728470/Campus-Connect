package com.campusconnect.service;

import com.campusconnect.config.UploadProperties;
import com.campusconnect.dto.file.FileResponse;
import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.StoredFile;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ApiException;
import com.campusconnect.mapper.FileMapper;
import com.campusconnect.repository.StoredFileRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.SecurityUtils;
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

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp",
            "application/zip",
            "application/x-zip-compressed",
            "application/octet-stream"
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
        classroomAccessService.requireMembership(classroomId);
        validate(multipartFile);

        Classroom classroom = classroomAccessService.requireClassroom(classroomId);
        User uploader = userRepository.findById(SecurityUtils.currentUser().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        String originalName = Objects.requireNonNullElse(multipartFile.getOriginalFilename(), "file");
        String extension = extensionOf(originalName);
        String storedName = UUID.randomUUID().toString().replace("-", "") + (extension.isEmpty() ? "" : "." + extension);

        try {
            Path target = rootDir.resolve(storedName);
            Files.copy(multipartFile.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file");
        }

        String contentType = multipartFile.getContentType() != null
                ? multipartFile.getContentType()
                : "application/octet-stream";

        StoredFile storedFile = StoredFile.builder()
                .classroom(classroom)
                .uploadedBy(uploader)
                .storedName(storedName)
                .originalName(originalName)
                .contentType(contentType)
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

    @Transactional(readOnly = true)
    public FileResponse getMetadata(Long fileId) {
        StoredFile file = storedFileRepository.findById(fileId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "File not found"));
        classroomAccessService.requireMembership(file.getClassroom().getId());
        return fileMapper.toResponse(file);
    }

    @Transactional(readOnly = true)
    public Resource loadAsResource(Long fileId) {
        StoredFile file = storedFileRepository.findById(fileId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "File not found"));
        classroomAccessService.requireMembership(file.getClassroom().getId());

        try {
            Path path = rootDir.resolve(file.getStoredName()).normalize();
            if (!path.startsWith(rootDir) || !Files.exists(path)) {
                throw new ApiException(HttpStatus.NOT_FOUND, "File not found on disk");
            }
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ApiException(HttpStatus.NOT_FOUND, "File not found on disk");
            }
            return resource;
        } catch (MalformedURLException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read file");
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

    public String contentType(Long fileId) {
        return requireFile(fileId).getContentType();
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
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank() && !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            // Some browsers send odd MIME types; extension check is the primary gate.
            if (!contentType.startsWith("image/") && !contentType.equals("application/octet-stream")) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported content type: " + contentType);
            }
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
