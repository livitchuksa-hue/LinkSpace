package ru.linkspace.service;

import java.util.List;
import org.springframework.stereotype.Service;
import ru.linkspace.dto.ConnectionRequest;
import ru.linkspace.exception.ResourceNotFoundException;
import ru.linkspace.model.Connection;
import ru.linkspace.repository.ConnectionRepository;
import ru.linkspace.repository.ObjectRepository;

@Service
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final ObjectRepository objectRepository;

    public ConnectionService(ConnectionRepository connectionRepository, ObjectRepository objectRepository) {
        this.connectionRepository = connectionRepository;
        this.objectRepository = objectRepository;
    }

    public List<Connection> findAll() {
        return connectionRepository.findAll();
    }

    public Connection findById(Long id) {
        return connectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Connection not found: " + id));
    }

    public Connection create(ConnectionRequest request) {
        validateEndpoints(request, null);
        Connection connection = new Connection();
        connection.setSourceId(request.getSourceId());
        connection.setTargetId(request.getTargetId());
        connection.setLabel(normalizeLabel(request.getLabel()));
        connection.setColor(normalizeColor(request.getColor()));
        connection.setZIndex(request.getZIndex());
        return connectionRepository.insert(connection);
    }

    public Connection update(Long id, ConnectionRequest request) {
        validateEndpoints(request, id);
        Connection existing = findById(id);
        existing.setSourceId(request.getSourceId());
        existing.setTargetId(request.getTargetId());
        existing.setLabel(normalizeLabel(request.getLabel()));
        existing.setColor(normalizeColor(request.getColor()));
        existing.setZIndex(request.getZIndex());
        return connectionRepository.update(existing);
    }

    public void delete(Long id) {
        if (!connectionRepository.deleteById(id)) {
            throw new ResourceNotFoundException("Connection not found: " + id);
        }
    }

    private void validateEndpoints(ConnectionRequest request, Long excludeId) {
        if (request.getSourceId().equals(request.getTargetId())) {
            throw new IllegalArgumentException("Нельзя связать узел сам с собой");
        }
        objectRepository.findById(request.getSourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Source object not found: " + request.getSourceId()));
        objectRepository.findById(request.getTargetId())
                .orElseThrow(() -> new ResourceNotFoundException("Target object not found: " + request.getTargetId()));
        if (connectionRepository.existsPairExcluding(request.getSourceId(), request.getTargetId(), excludeId)) {
            throw new IllegalArgumentException("Связь между этими узлами уже существует");
        }
    }

    private String normalizeLabel(String label) {
        if (label == null || label.isBlank()) {
            return null;
        }
        return label.trim();
    }

    private String normalizeColor(String color) {
        if (color == null || color.isBlank()) {
            return null;
        }
        return color.trim();
    }
}
