package ru.linkspace.repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import ru.linkspace.model.Connection;

@Repository
public class ConnectionRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Connection> rowMapper = (rs, rowNum) -> {
        Connection connection = new Connection();
        connection.setId(rs.getLong("id"));
        connection.setSourceId(rs.getLong("source_id"));
        connection.setTargetId(rs.getLong("target_id"));
        connection.setLabel(rs.getString("label"));
        connection.setColor(rs.getString("color"));
        int zIndex = rs.getInt("z_index");
        connection.setZIndex(rs.wasNull() ? null : zIndex);
        return connection;
    };

    public ConnectionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Connection> findAll() {
        return jdbcTemplate.query("SELECT * FROM connections ORDER BY id", rowMapper);
    }

    public Optional<Connection> findById(Long id) {
        List<Connection> result = jdbcTemplate.query(
                "SELECT * FROM connections WHERE id = ?",
                rowMapper,
                id
        );
        return result.stream().findFirst();
    }

    public Connection insert(Connection connection) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO connections (source_id, target_id, label, color, z_index) VALUES (?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, connection.getSourceId());
            ps.setLong(2, connection.getTargetId());
            ps.setString(3, connection.getLabel());
            ps.setString(4, connection.getColor());
            setZIndex(ps, 5, connection.getZIndex());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key != null) {
            connection.setId(key.longValue());
        }
        return connection;
    }

    public Connection update(Connection connection) {
        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                    "UPDATE connections SET source_id = ?, target_id = ?, label = ?, color = ?, z_index = ? WHERE id = ?"
            );
            ps.setLong(1, connection.getSourceId());
            ps.setLong(2, connection.getTargetId());
            ps.setString(3, connection.getLabel());
            ps.setString(4, connection.getColor());
            setZIndex(ps, 5, connection.getZIndex());
            ps.setLong(6, connection.getId());
            return ps;
        });
        return connection;
    }

    private void setZIndex(PreparedStatement ps, int index, Integer zIndex) throws java.sql.SQLException {
        if (zIndex == null) {
            ps.setObject(index, null);
        } else {
            ps.setInt(index, zIndex);
        }
    }

    public boolean deleteById(Long id) {
        return jdbcTemplate.update("DELETE FROM connections WHERE id = ?", id) > 0;
    }

    public void deleteByObjectId(Long objectId) {
        jdbcTemplate.update(
                "DELETE FROM connections WHERE source_id = ? OR target_id = ?",
                objectId,
                objectId
        );
    }

    public boolean existsPair(Long sourceId, Long targetId) {
        return existsPairExcluding(sourceId, targetId, null);
    }

    public boolean existsPairExcluding(Long sourceId, Long targetId, Long excludeId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM connections
                WHERE id IS NOT ?
                  AND ((source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?))
                """,
                Integer.class,
                excludeId,
                sourceId,
                targetId,
                targetId,
                sourceId
        );
        return count != null && count > 0;
    }
}
