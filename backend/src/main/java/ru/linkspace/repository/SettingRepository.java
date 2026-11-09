package ru.linkspace.repository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SettingRepository {

    private final JdbcTemplate jdbcTemplate;

    public SettingRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, String> findAll() {
        return jdbcTemplate.query(
                "SELECT key, value FROM workspace_settings ORDER BY key",
                (rs, rowNum) -> Map.entry(rs.getString("key"), rs.getString("value"))
        ).stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    public String findByKey(String key) {
        List<String> values = jdbcTemplate.query(
                "SELECT value FROM workspace_settings WHERE key = ?",
                (rs, rowNum) -> rs.getString("value"),
                key
        );
        return values.isEmpty() ? null : values.get(0);
    }

    public void upsert(String key, String value) {
        jdbcTemplate.update(
                """
                INSERT INTO workspace_settings (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                key,
                value
        );
    }

    public boolean deleteByKey(String key) {
        return jdbcTemplate.update("DELETE FROM workspace_settings WHERE key = ?", key) > 0;
    }
}
