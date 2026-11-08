package ru.linkspace.service;

import java.util.List;
import org.springframework.stereotype.Service;
import ru.linkspace.dto.ObjectRequest;
import ru.linkspace.exception.ResourceNotFoundException;
import ru.linkspace.model.InformationObject;
import ru.linkspace.repository.ObjectRepository;

@Service
public class ObjectService {

    private final ObjectRepository objectRepository;

    public ObjectService(ObjectRepository objectRepository) {
        this.objectRepository = objectRepository;
    }

    public List<InformationObject> findAll() {
        return objectRepository.findAll();
    }

    public InformationObject findById(Long id) {
        return objectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Object not found: " + id));
    }

    public InformationObject create(ObjectRequest request) {
        InformationObject object = mapRequest(new InformationObject(), request);
        return objectRepository.insert(object);
    }

    public InformationObject update(Long id, ObjectRequest request) {
        InformationObject existing = findById(id);
        return objectRepository.update(mapRequest(existing, request));
    }

    public void delete(Long id) {
        if (!objectRepository.deleteById(id)) {
            throw new ResourceNotFoundException("Object not found: " + id);
        }
    }

    private InformationObject mapRequest(InformationObject target, ObjectRequest request) {
        target.setTitle(request.getTitle());
        target.setType(request.getType());
        target.setDescription(request.getDescription());
        target.setContent(request.getContent());
        target.setPath(request.getPath());
        target.setUrl(request.getUrl());
        target.setX(request.getX());
        target.setY(request.getY());
        return target;
    }
}
