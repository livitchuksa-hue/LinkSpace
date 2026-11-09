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
import ru.linkspace.model.Region;

@Repository
public class RegionRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Region> rowMapper = (rs, rowNum) -> {
        Region region = new Region();
        region.setId(rs.getLong("id"));
        region.setName(rs.getString("name"));
        region.setColor(rs.getString("color"));
        region.setCoordinates(rs.getString("coordinates"));
        region.setShape(rs.getString("shape"));
        int zIndex = rs.getInt("z_index");
        region.setZIndex(rs.wasNull() ? null : zIndex);
        return region;
    };

    public RegionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Region> findAll() {
        return jdbcTemplate.query("SELECT * FROM regions ORDER BY id", rowMapper);
    }

    public Optional<Region> findById(Long id) {
        List<Region> result = jdbcTemplate.query(
                "SELECT * FROM regions WHERE id = ?",
                rowMapper,
                id
        );
        return result.stream().findFirst();
    }

    public Region insert(Region region) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO regions (name, color, coordinates, shape, z_index) VALUES (?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, region.getName());
            ps.setString(2, region.getColor());
            ps.setString(3, region.getCoordinates());
            ps.setString(4, region.getShape());
            setZIndex(ps, 5, region.getZIndex());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key != null) {
            region.setId(key.longValue());
        }
        return region;
    }

    public Region update(Region region) {
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "UPDATE regions SET name = ?, color = ?, coordinates = ?, shape = ?, z_index = ? WHERE id = ?"
            );
            ps.setString(1, region.getName());
            ps.setString(2, region.getColor());
            ps.setString(3, region.getCoordinates());
            ps.setString(4, region.getShape());
            setZIndex(ps, 5, region.getZIndex());
            ps.setLong(6, region.getId());
            return ps;
        });
        return region;
    }

    private void setZIndex(PreparedStatement ps, int index, Integer zIndex) throws java.sql.SQLException {
        if (zIndex == null) {
            ps.setObject(index, null);
        } else {
            ps.setInt(index, zIndex);
        }
    }

    public boolean deleteById(Long id) {
        return jdbcTemplate.update("DELETE FROM regions WHERE id = ?", id) > 0;
    }
}
