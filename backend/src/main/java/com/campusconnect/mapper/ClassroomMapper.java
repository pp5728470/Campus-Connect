package com.campusconnect.mapper;

import com.campusconnect.dto.classroom.ClassroomMemberResponse;
import com.campusconnect.dto.classroom.ClassroomResponse;
import com.campusconnect.entity.ClassRole;
import com.campusconnect.entity.Classroom;
import com.campusconnect.entity.Enrollment;
import org.springframework.stereotype.Component;

@Component
public class ClassroomMapper {

    public ClassroomResponse toResponse(Classroom classroom, ClassRole myRole) {
        return new ClassroomResponse(
                classroom.getId(),
                classroom.getName(),
                classroom.getSection(),
                classroom.getSubject(),
                classroom.getRoom(),
                classroom.getDescription(),
                classroom.getClassCode(),
                classroom.getBannerColor(),
                classroom.isArchived(),
                classroom.getCreatedAt(),
                classroom.getOwner().getId(),
                classroom.getOwner().getFullName(),
                myRole
        );
    }

    public ClassroomMemberResponse toMemberResponse(Enrollment enrollment) {
        return new ClassroomMemberResponse(
                enrollment.getUser().getId(),
                enrollment.getUser().getFullName(),
                enrollment.getUser().getEmail(),
                enrollment.getUser().getAvatarUrl(),
                enrollment.getRoleInClass(),
                enrollment.getJoinedAt()
        );
    }
}
