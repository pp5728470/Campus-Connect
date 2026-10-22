package com.campusconnect.controller;

import com.campusconnect.dto.admin.AdminClassroomResponse;
import com.campusconnect.dto.admin.AdminStatsResponse;
import com.campusconnect.dto.admin.UpdateRoleRequest;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.dto.user.UserResponse;
import com.campusconnect.entity.Role;
import com.campusconnect.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    @Operation(summary = "Platform totals (admin)")
    public AdminStatsResponse stats() {
        return adminService.stats();
    }

    @GetMapping("/users")
    @Operation(summary = "List users, optionally filtered by name/email and role (admin)")
    public PageResponse<UserResponse> listUsers(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.listUsers(q, role, page, size);
    }

    @PatchMapping("/users/{id}/activate")
    @Operation(summary = "Activate a user and lift any login lock (admin)")
    public UserResponse activate(@PathVariable Long id) {
        return adminService.setActive(id, true);
    }

    @PatchMapping("/users/{id}/deactivate")
    @Operation(summary = "Deactivate a user and revoke their sessions (admin)")
    public UserResponse deactivate(@PathVariable Long id) {
        return adminService.setActive(id, false);
    }

    @PatchMapping("/users/{id}/role")
    @Operation(summary = "Change a user's role (admin)")
    public UserResponse changeRole(@PathVariable Long id, @Valid @RequestBody UpdateRoleRequest request) {
        return adminService.setRole(id, request.role());
    }

    @GetMapping("/classrooms")
    @Operation(summary = "List all classes (admin)")
    public PageResponse<AdminClassroomResponse> listClassrooms(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.listClassrooms(q, page, size);
    }
}
