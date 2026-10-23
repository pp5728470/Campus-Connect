package com.campusconnect.util;

import java.util.Locale;
import java.util.Set;

/** The six notebook cover names stored in classrooms.banner_color. */
public final class CoverColor {

    public static final String DEFAULT = "teal";

    public static final Set<String> ALL = Set.of(
            "teal", "maroon", "forest", "indigo", "steel", "ochre"
    );

    /** Bean Validation / OpenAPI pattern for request DTOs. */
    public static final String PATTERN = "teal|maroon|forest|indigo|steel|ochre";

    private CoverColor() {
    }

    public static boolean isValid(String value) {
        return value != null && ALL.contains(value.trim().toLowerCase(Locale.ROOT));
    }

    public static String normalizeOrDefault(String value) {
        if (value == null || value.isBlank()) {
            return DEFAULT;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return ALL.contains(normalized) ? normalized : DEFAULT;
    }
}
