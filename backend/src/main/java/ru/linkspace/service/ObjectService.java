package ru.linkspace.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import ru.linkspace.dto.ObjectRequest;
import ru.linkspace.dto.PositionRequest;
import ru.linkspace.exception.ResourceNotFoundException;
import ru.linkspace.model.InformationObject;
import ru.linkspace.repository.ConnectionRepository;
import ru.linkspace.repository.ObjectRepository;

@Service
public class ObjectService {

    private static final Set<String> OBJECT_TYPES = Set.of("NOTE", "FILE", "FOLDER", "LINK");

    private final ObjectRepository objectRepository;
    private final ConnectionRepository connectionRepository;

    public ObjectService(ObjectRepository objectRepository, ConnectionRepository connectionRepository) {
        this.objectRepository = objectRepository;
        this.connectionRepository = connectionRepository;
    }

    public List<InformationObject> findAll() {
        return objectRepository.findAll();
    }

    public InformationObject findById(Long id) {
        return objectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Object not found: " + id));
    }

    public InformationObject create(ObjectRequest request) {
        validate(request);
        InformationObject object = mapRequest(new InformationObject(), request);
        return objectRepository.insert(object);
    }

    public InformationObject update(Long id, ObjectRequest request) {
        validate(request);
        InformationObject existing = findById(id);
        Instant lastOpenedAt = existing.getLastOpenedAt();
        InformationObject updated = objectRepository.update(mapRequest(existing, request));
        updated.setLastOpenedAt(lastOpenedAt);
        return updated;
    }

    public InformationObject updatePosition(Long id, PositionRequest request) {
        InformationObject existing = findById(id);
        existing.setX(request.getX());
        existing.setY(request.getY());
        objectRepository.updatePosition(id, request.getX(), request.getY());
        return existing;
    }

    public InformationObject markOpened(Long id) {
        InformationObject existing = findById(id);
        Instant openedAt = Instant.now();
        existing.setLastOpenedAt(openedAt);
        objectRepository.updateLastOpenedAt(id, openedAt);
        return existing;
    }

    public void delete(Long id) {
        connectionRepository.deleteByObjectId(id);
        if (!objectRepository.deleteById(id)) {
            throw new ResourceNotFoundException("Object not found: " + id);
        }
    }

    private void validate(ObjectRequest request) {
        String type = request.getType() == null
                ? ""
                : request.getType().trim().toUpperCase(Locale.ROOT);
        if (!OBJECT_TYPES.contains(type)) {
            throw new IllegalArgumentException("Unsupported object type: " + request.getType());
        }

        if ("FILE".equals(type) || "FOLDER".equals(type)) {
            if (request.getPath() == null || request.getPath().isBlank()) {
                throw new IllegalArgumentException("Path is required for file and folder objects");
            }
        }

        if ("LINK".equals(type)) {
            String url = request.getUrl() == null ? "" : request.getUrl().trim();
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                throw new IllegalArgumentException("Link objects require an http(s) URL");
            }
        }
    }

    private InformationObject mapRequest(InformationObject target, ObjectRequest request) {
        target.setTitle(request.getTitle().trim());
        target.setType(request.getType().trim().toUpperCase(Locale.ROOT));
        target.setDescription(emptyToNull(request.getDescription()));
        target.setContent(emptyToNull(request.getContent()));
        target.setPath(emptyToNull(request.getPath()));
        target.setUrl(emptyToNull(request.getUrl()));
        target.setDisk(emptyToNull(request.getDisk()));
        target.setFileSize(request.getFileSize());
        target.setFileCreatedAt(request.getFileCreatedAt());
        target.setFileModifiedAt(request.getFileModifiedAt());
        target.setX(request.getX());
        target.setY(request.getY());
        target.setColor(emptyToNull(request.getColor()));
        target.setWidth(request.getWidth());
        target.setHeight(request.getHeight());
        target.setTags(emptyToNull(request.getTags()));
        target.setPreview(emptyToNull(request.getPreview()));
        target.setZIndex(request.getZIndex());
        return target;
    }

    private String emptyToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
