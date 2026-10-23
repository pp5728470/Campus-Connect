-- Restrict classroom banner_color to the six notebook cover names.
-- Maps any existing hex (or unknown) value to the nearest cover; default teal.

ALTER TABLE classrooms
    MODIFY COLUMN banner_color VARCHAR(16) NOT NULL DEFAULT 'teal';

-- Keep values that are already cover names.
UPDATE classrooms
SET banner_color = LOWER(TRIM(banner_color))
WHERE LOWER(TRIM(banner_color)) IN ('teal', 'maroon', 'forest', 'indigo', 'steel', 'ochre');

-- Exact hex matches for the six official covers (any letter case).
UPDATE classrooms SET banner_color = 'teal'   WHERE UPPER(banner_color) IN ('#0E6B66');
UPDATE classrooms SET banner_color = 'maroon' WHERE UPPER(banner_color) IN ('#86293F');
UPDATE classrooms SET banner_color = 'forest' WHERE UPPER(banner_color) IN ('#2F6A3B');
UPDATE classrooms SET banner_color = 'indigo' WHERE UPPER(banner_color) IN ('#363D8C');
UPDATE classrooms SET banner_color = 'steel'  WHERE UPPER(banner_color) IN ('#2C5A84');
UPDATE classrooms SET banner_color = 'ochre'  WHERE UPPER(banner_color) IN ('#8C5F0E');

-- Common legacy Google Classroom / Phase-1 seed hexes → nearest cover.
UPDATE classrooms SET banner_color = 'indigo' WHERE UPPER(banner_color) IN ('#1A73E8', '#1967D2', '#174EA6', '#4285F4', '#3F51B5');
UPDATE classrooms SET banner_color = 'forest' WHERE UPPER(banner_color) IN ('#137333', '#0D652D', '#34A853', '#188038');
UPDATE classrooms SET banner_color = 'maroon' WHERE UPPER(banner_color) IN ('#C5221F', '#D93025', '#EA4335', '#B31412', '#A50E0E');
UPDATE classrooms SET banner_color = 'ochre'  WHERE UPPER(banner_color) IN ('#E37400', '#F9AB00', '#F29900', '#E8710A');
UPDATE classrooms SET banner_color = 'steel'  WHERE UPPER(banner_color) IN ('#5F6368', '#202124', '#3C4043', '#174EA6');
UPDATE classrooms SET banner_color = 'teal'   WHERE UPPER(banner_color) IN ('#007B83', '#0B8043', '#129EAF');

-- Remaining #RRGGBB values: Euclidean distance to the six covers in RGB space.
UPDATE classrooms c
SET banner_color = (
    SELECT cover
    FROM (
        SELECT 'teal'   AS cover,
               POW(CONV(SUBSTRING(UPPER(c.banner_color), 2, 2), 16, 10) - 14, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 4, 2), 16, 10) - 107, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 6, 2), 16, 10) - 102, 2) AS dist
        UNION ALL
        SELECT 'maroon',
               POW(CONV(SUBSTRING(UPPER(c.banner_color), 2, 2), 16, 10) - 134, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 4, 2), 16, 10) - 41, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 6, 2), 16, 10) - 63, 2)
        UNION ALL
        SELECT 'forest',
               POW(CONV(SUBSTRING(UPPER(c.banner_color), 2, 2), 16, 10) - 47, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 4, 2), 16, 10) - 106, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 6, 2), 16, 10) - 59, 2)
        UNION ALL
        SELECT 'indigo',
               POW(CONV(SUBSTRING(UPPER(c.banner_color), 2, 2), 16, 10) - 54, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 4, 2), 16, 10) - 61, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 6, 2), 16, 10) - 140, 2)
        UNION ALL
        SELECT 'steel',
               POW(CONV(SUBSTRING(UPPER(c.banner_color), 2, 2), 16, 10) - 44, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 4, 2), 16, 10) - 90, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 6, 2), 16, 10) - 132, 2)
        UNION ALL
        SELECT 'ochre',
               POW(CONV(SUBSTRING(UPPER(c.banner_color), 2, 2), 16, 10) - 140, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 4, 2), 16, 10) - 95, 2)
             + POW(CONV(SUBSTRING(UPPER(c.banner_color), 6, 2), 16, 10) - 14, 2)
    ) ranked
    ORDER BY dist
    LIMIT 1
)
WHERE c.banner_color REGEXP '^#[0-9A-Fa-f]{6}$';

-- Anything still not a cover name becomes teal.
UPDATE classrooms
SET banner_color = 'teal'
WHERE banner_color NOT IN ('teal', 'maroon', 'forest', 'indigo', 'steel', 'ochre');
