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
                    "INSERT INTO connections (source_id, target_id, label) VALUES (?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, connection.getSourceId());
            ps.setLong(2, connection.getTargetId());
            ps.setString(3, connection.getLabel());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key != null) {
            connection.setId(key.longValue());
        }
        return connection;
    }

    public Connection update(Connection connection) {
        jdbcTemplate.update(
                "UPDATE connections SET source_id = ?, target_id = ?, label = ? WHERE id = ?",
                connection.getSourceId(),
                connection.getTargetId(),
                connection.getLabel(),
                connection.getId()
        );
        return connection;
    }

    public boolean deleteById(Long id) {
        return jdbcTemplate.update("DELETE FROM connections WHERE id = ?", id) > 0;
    }
}
