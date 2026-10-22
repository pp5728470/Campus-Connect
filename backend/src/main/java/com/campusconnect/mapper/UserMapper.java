package com.campusconnect.mapper;

import com.campusconnect.dto.user.UserResponse;
import com.campusconnect.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getAvatarUrl(),
                user.getCreatedAt()
        );
    }
}
