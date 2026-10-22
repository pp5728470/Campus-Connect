package com.campusconnect.dto.admin;

import com.campusconnect.entity.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
        @NotNull(message = "Role is required")
        Role role
) {
}