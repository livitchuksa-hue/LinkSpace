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
import ru.linkspace.dto.RegionRequest;
import ru.linkspace.model.Region;
import ru.linkspace.service.RegionService;

@RestController
@RequestMapping("/api/regions")
public class RegionController {

    private final RegionService regionService;

    public RegionController(RegionService regionService) {
        this.regionService = regionService;
    }

    @GetMapping
    public List<Region> getAll() {
        return regionService.findAll();
    }

    @GetMapping("/{id}")
    public Region getById(@PathVariable Long id) {
        return regionService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Region create(@Valid @RequestBody RegionRequest request) {
        return regionService.create(request);
    }

    @PutMapping("/{id}")
    public Region update(@PathVariable Long id, @Valid @RequestBody RegionRequest request) {
        return regionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        regionService.delete(id);
    }
}
