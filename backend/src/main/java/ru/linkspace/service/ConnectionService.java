package ru.linkspace.service;

import java.util.List;
import org.springframework.stereotype.Service;
import ru.linkspace.dto.ConnectionRequest;
import ru.linkspace.exception.ResourceNotFoundException;
import ru.linkspace.model.Connection;
import ru.linkspace.repository.ConnectionRepository;

@Service
public class ConnectionService {

    private final ConnectionRepository connectionRepository;

    public ConnectionService(ConnectionRepository connectionRepository) {
        this.connectionRepository = connectionRepository;
    }

    public List<Connection> findAll() {
        return connectionRepository.findAll();
    }

    public Connection findById(Long id) {
        return connectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found: " + id));
    }

    public Connection create(ConnectionRequest request) {
        Connection connection = new Connection();
        connection.setSourceId(request.getSourceId());
        connection.setTargetId(request.getTargetId());
        connection.setLabel(request.getLabel());
        return connectionRepository.insert(connection);
    }

    public Connection update(Long id, ConnectionRequest request) {
        Connection existing = findById(id);
        existing.setSourceId(request.getSourceId());
        existing.setTargetId(request.getTargetId());
        existing.setLabel(request.getLabel());
        return connectionRepository.update(existing);
    }

    public void delete(Long id) {
        if (!connectionRepository.deleteById(id)) {
            throw new ResourceNotFoundException("Connection not found: " + id);
        }
    }
}
