package ru.linkspace.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Включает внешние ключи SQLite и добавляет новые колонки в уже существующую базу.
 */
@Component
public class SchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public SchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("PRAGMA foreign_keys = ON");
        addColumnIfMissing("information_objects", "disk", "TEXT");
        addColumnIfMissing("information_objects", "file_size", "INTEGER");
        addColumnIfMissing("information_objects", "file_created_at", "TEXT");
        addColumnIfMissing("information_objects", "file_modified_at", "TEXT");
        addColumnIfMissing("information_objects", "last_opened_at", "TEXT");
        addColumnIfMissing("information_objects", "color", "TEXT");
        addColumnIfMissing("information_objects", "width", "REAL");
        addColumnIfMissing("information_objects", "height", "REAL");
        addColumnIfMissing("information_objects", "tags", "TEXT");
        addColumnIfMissing("information_objects", "preview", "TEXT");
        addColumnIfMissing("information_objects", "z_index", "INTEGER");
        addColumnIfMissing("connections", "color", "TEXT");
        addColumnIfMissing("connections", "z_index", "INTEGER");
        addColumnIfMissing("regions", "shape", "TEXT");
        addColumnIfMissing("regions", "z_index", "INTEGER");
        jdbcTemplate.execute(
                """
                CREATE TABLE IF NOT EXISTS workspace_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
                """
        );
    }

    private void addColumnIfMissing(String table, String column, String type) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM pragma_table_info(?) WHERE name = ?
                """,
                Integer.class,
                table,
                column
        );
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + type);
        }
    }
}
