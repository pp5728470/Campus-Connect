package com.campusconnect.mapper;

import com.campusconnect.dto.file.FileResponse;
import com.campusconnect.entity.StoredFile;
import org.springframework.stereotype.Component;

@Component
public class FileMapper {

    public FileResponse toResponse(StoredFile file) {
        return new FileResponse(
                file.getId(),
                file.getOriginalName(),
                file.getContentType(),
                file.getSizeBytes(),
                file.getCreatedAt()
        );
    }
}
