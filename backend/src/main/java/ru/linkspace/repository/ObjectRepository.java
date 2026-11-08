package ru.linkspace.repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import ru.linkspace.model.InformationObject;

@Repository
public class ObjectRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<InformationObject> rowMapper = (rs, rowNum) -> {
        InformationObject object = new InformationObject();
        object.setId(rs.getLong("id"));
        object.setTitle(rs.getString("title"));
        object.setType(rs.getString("type"));
        object.setDescription(rs.getString("description"));
        object.setContent(rs.getString("content"));
        object.setPath(rs.getString("path"));
        object.setUrl(rs.getString("url"));
        object.setX(rs.getDouble("x"));
        object.setY(rs.getDouble("y"));
        object.setCreatedAt(Instant.parse(rs.getString("created_at")));
        object.setUpdatedAt(Instant.parse(rs.getString("updated_at")));
        return object;
    };

    public ObjectRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<InformationObject> findAll() {
        return jdbcTemplate.query(
                "SELECT * FROM information_objects ORDER BY id",
                rowMapper
        );
    }

    public Optional<InformationObject> findById(Long id) {
        List<InformationObject> result = jdbcTemplate.query(
                "SELECT * FROM information_objects WHERE id = ?",
                rowMapper,
                id
        );
        return result.stream().findFirst();
    }

    public InformationObject insert(InformationObject object) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        Instant now = Instant.now();
        object.setCreatedAt(now);
        object.setUpdatedAt(now);

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                    INSERT INTO information_objects
                    (title, type, description, content, path, url, x, y, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, object.getTitle());
            ps.setString(2, object.getType());
            ps.setString(3, object.getDescription());
            ps.setString(4, object.getContent());
            ps.setString(5, object.getPath());
            ps.setString(6, object.getUrl());
            ps.setDouble(7, object.getX() != null ? object.getX() : 0);
            ps.setDouble(8, object.getY() != null ? object.getY() : 0);
            ps.setString(9, object.getCreatedAt().toString());
            ps.setString(10, object.getUpdatedAt().toString());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key != null) {
            object.setId(key.longValue());
        }
        return object;
    }

    public InformationObject update(InformationObject object) {
        object.setUpdatedAt(Instant.now());
        jdbcTemplate.update(
                """
                UPDATE information_objects
                SET title = ?, type = ?, description = ?, content = ?, path = ?, url = ?,
                    x = ?, y = ?, updated_at = ?
                WHERE id = ?
                """,
                object.getTitle(),
                object.getType(),
                object.getDescription(),
                object.getContent(),
                object.getPath(),
                object.getUrl(),
                object.getX(),
                object.getY(),
                object.getUpdatedAt().toString(),
                object.getId()
        );
        return object;
    }

    public boolean deleteById(Long id) {
        return jdbcTemplate.update("DELETE FROM information_objects WHERE id = ?", id) > 0;
    }
}
