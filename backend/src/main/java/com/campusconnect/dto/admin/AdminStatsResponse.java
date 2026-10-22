package com.campusconnect.dto.admin;

public record AdminStatsResponse(
        long totalUsers,
        long totalTeachers,
        long totalStudents,
        long totalAdmins,
        long totalClasses,
        long totalSubmissions,
        long storageBytes
) {
}