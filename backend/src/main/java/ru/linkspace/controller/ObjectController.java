package ru.linkspace.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ru.linkspace.dto.ObjectRequest;
import ru.linkspace.dto.ObjectResponse;
import ru.linkspace.service.ObjectService;

@RestController
@RequestMapping("/api/objects")
public class ObjectController {

    private final ObjectService objectService;

    public ObjectController(ObjectService objectService) {
        this.objectService = objectService;
    }

    @GetMapping
    public List<ObjectResponse> getAll() {
        return objectService.findAll().stream().map(ObjectResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ObjectResponse getById(@PathVariable Long id) {
        return ObjectResponse.from(objectService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ObjectResponse create(@Valid @RequestBody ObjectRequest request) {
        return ObjectResponse.from(objectService.create(request));
    }

    @PutMapping("/{id}")
    public ObjectResponse update(@PathVariable Long id, @Valid @RequestBody ObjectRequest request) {
        return ObjectResponse.from(objectService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        objectService.delete(id);
    }
}
