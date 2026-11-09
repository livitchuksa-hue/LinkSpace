package ru.linkspace.repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
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

    private final RowMapper<InformationObject> rowMapper = (rs, rowNum) -> mapRow(rs);

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
                    (title, type, description, content, path, url, disk, file_size,
                     file_created_at, file_modified_at, x, y, color, width, height, tags,
                     z_index, preview, created_at, updated_at, last_opened_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            bindObject(ps, object);
            ps.setString(19, object.getCreatedAt().toString());
            ps.setString(20, object.getUpdatedAt().toString());
            ps.setString(21, instantToString(object.getLastOpenedAt()));
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
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                    UPDATE information_objects
                    SET title = ?, type = ?, description = ?, content = ?, path = ?, url = ?,
                        disk = ?, file_size = ?, file_created_at = ?, file_modified_at = ?,
                        x = ?, y = ?, color = ?, width = ?, height = ?, tags = ?,
                        z_index = ?, preview = ?, updated_at = ?, last_opened_at = ?
                    WHERE id = ?
                    """
            );
            bindObject(ps, object);
            ps.setString(19, object.getUpdatedAt().toString());
            ps.setString(20, instantToString(object.getLastOpenedAt()));
            ps.setLong(21, object.getId());
            return ps;
        });
        return object;
    }

    public void updatePosition(Long id, double x, double y) {
        jdbcTemplate.update(
                "UPDATE information_objects SET x = ?, y = ?, updated_at = ? WHERE id = ?",
                x,
                y,
                Instant.now().toString(),
                id
        );
    }

    public void updateLastOpenedAt(Long id, Instant openedAt) {
        jdbcTemplate.update(
                "UPDATE information_objects SET last_opened_at = ? WHERE id = ?",
                openedAt.toString(),
                id
        );
    }

    public boolean deleteById(Long id) {
        return jdbcTemplate.update("DELETE FROM information_objects WHERE id = ?", id) > 0;
    }

    private void bindObject(PreparedStatement ps, InformationObject object) throws SQLException {
        ps.setString(1, object.getTitle());
        ps.setString(2, object.getType());
        ps.setString(3, object.getDescription());
        ps.setString(4, object.getContent());
        ps.setString(5, object.getPath());
        ps.setString(6, object.getUrl());
        ps.setString(7, object.getDisk());
        if (object.getFileSize() == null) {
            ps.setObject(8, null);
        } else {
            ps.setLong(8, object.getFileSize());
        }
        ps.setString(9, instantToString(object.getFileCreatedAt()));
        ps.setString(10, instantToString(object.getFileModifiedAt()));
        ps.setDouble(11, object.getX() != null ? object.getX() : 0);
        ps.setDouble(12, object.getY() != null ? object.getY() : 0);
        ps.setString(13, object.getColor());
        setNullableDouble(ps, 14, object.getWidth());
        setNullableDouble(ps, 15, object.getHeight());
        ps.setString(16, object.getTags());
        if (object.getZIndex() == null) {
            ps.setObject(17, null);
        } else {
            ps.setInt(17, object.getZIndex());
        }
        ps.setString(18, object.getPreview());
    }

    private void setNullableDouble(PreparedStatement ps, int index, Double value) throws SQLException {
        if (value == null) {
            ps.setObject(index, null);
        } else {
            ps.setDouble(index, value);
        }
    }

    private InformationObject mapRow(ResultSet rs) throws SQLException {
        InformationObject object = new InformationObject();
        object.setId(rs.getLong("id"));
        object.setTitle(rs.getString("title"));
        object.setType(rs.getString("type"));
        object.setDescription(rs.getString("description"));
        object.setContent(rs.getString("content"));
        object.setPath(rs.getString("path"));
        object.setUrl(rs.getString("url"));
        object.setDisk(rs.getString("disk"));
        long fileSize = rs.getLong("file_size");
        if (!rs.wasNull()) {
            object.setFileSize(fileSize);
        }
        object.setFileCreatedAt(parseInstant(rs.getString("file_created_at")));
        object.setFileModifiedAt(parseInstant(rs.getString("file_modified_at")));
        object.setX(rs.getDouble("x"));
        object.setY(rs.getDouble("y"));
        object.setColor(rs.getString("color"));
        object.setWidth(readNullableDouble(rs, "width"));
        object.setHeight(readNullableDouble(rs, "height"));
        object.setTags(rs.getString("tags"));
        object.setPreview(rs.getString("preview"));
        object.setZIndex(readNullableInt(rs, "z_index"));
        object.setCreatedAt(parseInstant(rs.getString("created_at")));
        object.setUpdatedAt(parseInstant(rs.getString("updated_at")));
        object.setLastOpenedAt(parseInstant(rs.getString("last_opened_at")));
        return object;
    }

    private Double readNullableDouble(ResultSet rs, String column) throws SQLException {
        double value = rs.getDouble(column);
        return rs.wasNull() ? null : value;
    }

    private Integer readNullableInt(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private Instant parseInstant(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Instant.parse(value);
    }

    private String instantToString(Instant value) {
        return value == null ? null : value.toString();
    }
}
