package com.campusconnect.util;

import java.util.Locale;

/** Builds safe, lower-cased LIKE patterns for the {@code ESCAPE '!'} queries used across repositories. */
public final class LikePattern {

    private LikePattern() {
    }

    /** Returns {@code %term%} with LIKE wildcards in the user input neutralised. */
    public static String contains(String term) {
        String escaped = term.trim().toLowerCase(Locale.ROOT)
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
        return "%" + escaped + "%";
    }
}