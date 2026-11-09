package ru.linkspace.controller;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ru.linkspace.dto.SettingRequest;
import ru.linkspace.service.SettingService;

@RestController
@RequestMapping("/api/settings")
public class SettingController {

    private final SettingService settingService;

    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    public Map<String, String> getAll() {
        return settingService.findAll();
    }

    @GetMapping("/{key}")
    public Map<String, String> getByKey(@PathVariable String key) {
        return Map.of("key", key, "value", settingService.findByKey(key) == null ? "" : settingService.findByKey(key));
    }

    @PutMapping("/{key}")
    public Map<String, String> upsert(@PathVariable String key, @Valid @RequestBody SettingRequest request) {
        return Map.of("key", key, "value", settingService.upsert(key, request.getValue()));
    }

    @DeleteMapping("/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String key) {
        settingService.delete(key);
    }
}
