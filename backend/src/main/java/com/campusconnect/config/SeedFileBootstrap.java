package com.campusconnect.config;

import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.Material;
import com.campusconnect.entity.StoredFile;
import com.campusconnect.entity.User;
import com.campusconnect.repository.ClassroomRepository;
import com.campusconnect.repository.MaterialRepository;
import com.campusconnect.repository.StoredFileRepository;
import com.campusconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;

/**
 * Dev-only: copies classpath sample files into {@code UPLOAD_DIR} and ensures
 * matching {@code stored_files} / {@code material_files} rows exist for Phase 2 seed materials.
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class SeedFileBootstrap implements ApplicationRunner {

    private final UploadProperties uploadProperties;
    private final StoredFileRepository storedFileRepository;
    private final MaterialRepository materialRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;

    private record SeedSpec(
            String classpathName,
            String storedName,
            String originalName,
            String contentType,
            long classroomId,
            long uploaderId,
            long materialId
    ) {
    }

    private static final List<SeedSpec> SPECS = List.of(
            new SeedSpec(
                    "seed-files/jdbc-quick-reference.pdf",
                    "seed-jdbc-quick-reference.pdf",
                    "jdbc-quick-reference.pdf",
                    "application/pdf",
                    1L, 1L, 1L
            ),
            new SeedSpec(
                    "seed-files/servlet-lifecycle.pdf",
                    "seed-servlet-lifecycle.pdf",
                    "servlet-lifecycle.pdf",
                    "application/pdf",
                    1L, 1L, 3L
            ),
            new SeedSpec(
                    "seed-files/bank-schema-notes.pdf",
                    "seed-bank-schema-notes.pdf",
                    "bank-schema-notes.pdf",
                    "application/pdf",
                    1L, 1L, 2L
            ),
            new SeedSpec(
                    "seed-files/jdbc-architecture.png",
                    "seed-jdbc-architecture.png",
                    "jdbc-architecture.png",
                    "image/png",
                    1L, 1L, 1L
            )
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        Path uploadDir = Path.of(uploadProperties.getDir()).toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);

        for (SeedSpec spec : SPECS) {
            ensureSeedFile(uploadDir, spec);
        }
        log.info("Dev seed files ensured under {}", uploadDir);
    }

    private void ensureSeedFile(Path uploadDir, SeedSpec spec) throws IOException {
        ClassPathResource resource = new ClassPathResource(spec.classpathName());
        if (!resource.exists()) {
            log.warn("Missing classpath seed file: {}", spec.classpathName());
            return;
        }

        Path target = uploadDir.resolve(spec.storedName()).normalize();
        if (!target.startsWith(uploadDir)) {
            throw new IOException("Invalid seed stored name: " + spec.storedName());
        }

        if (!Files.exists(target) || Files.size(target) == 0) {
            try (InputStream in = resource.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            log.info("Copied seed file {} -> {}", spec.classpathName(), target.getFileName());
        }

        long diskSize = Files.size(target);
        StoredFile storedFile = storedFileRepository.findByStoredName(spec.storedName())
                .orElseGet(() -> createStoredFile(spec, diskSize));

        if (storedFile == null) {
            return;
        }

        if (storedFile.getSizeBytes() != diskSize) {
            storedFile.setSizeBytes(diskSize);
            storedFileRepository.save(storedFile);
        }

        linkToMaterial(spec.materialId(), storedFile);
    }

    private StoredFile createStoredFile(SeedSpec spec, long sizeBytes) {
        Optional<Classroom> classroom = classroomRepository.findById(spec.classroomId());
        Optional<User> uploader = userRepository.findById(spec.uploaderId());
        if (classroom.isEmpty() || uploader.isEmpty()) {
            log.warn(
                    "Skipping DB row for {} — classroom {} or user {} not found (run seed SQL first)",
                    spec.storedName(),
                    spec.classroomId(),
                    spec.uploaderId()
            );
            return null;
        }

        StoredFile saved = storedFileRepository.save(StoredFile.builder()
                .classroom(classroom.get())
                .uploadedBy(uploader.get())
                .storedName(spec.storedName())
                .originalName(spec.originalName())
                .contentType(spec.contentType())
                .sizeBytes(sizeBytes)
                .build());
        log.info("Created stored_files row id={} for {}", saved.getId(), spec.storedName());
        return saved;
    }

    private void linkToMaterial(long materialId, StoredFile storedFile) {
        Optional<Material> materialOpt = materialRepository.findById(materialId);
        if (materialOpt.isEmpty()) {
            log.warn("Material {} not found; file {} not linked", materialId, storedFile.getStoredName());
            return;
        }
        Material material = materialOpt.get();
        boolean alreadyLinked = material.getFiles().stream()
                .anyMatch(f -> f.getId().equals(storedFile.getId())
                        || f.getStoredName().equals(storedFile.getStoredName()));
        if (!alreadyLinked) {
            material.getFiles().add(storedFile);
            materialRepository.save(material);
            log.info("Linked file {} to material {}", storedFile.getStoredName(), materialId);
        }
    }
}
