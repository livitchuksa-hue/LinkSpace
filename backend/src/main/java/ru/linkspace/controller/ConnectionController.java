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
import ru.linkspace.dto.ConnectionRequest;
import ru.linkspace.model.Connection;
import ru.linkspace.service.ConnectionService;

@RestController
@RequestMapping("/api/connections")
public class ConnectionController {

    private final ConnectionService connectionService;

    public ConnectionController(ConnectionService connectionService) {
        this.connectionService = connectionService;
    }

    @GetMapping
    public List<Connection> getAll() {
        return connectionService.findAll();
    }

    @GetMapping("/{id}")
    public Connection getById(@PathVariable Long id) {
        return connectionService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Connection create(@Valid @RequestBody ConnectionRequest request) {
        return connectionService.create(request);
    }

    @PutMapping("/{id}")
    public Connection update(@PathVariable Long id, @Valid @RequestBody ConnectionRequest request) {
        return connectionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        connectionService.delete(id);
    }
}
