package ru.linkspace.service;

import java.util.Map;
import org.springframework.stereotype.Service;
import ru.linkspace.repository.SettingRepository;

@Service
public class SettingService {

    private final SettingRepository settingRepository;

    public SettingService(SettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    public Map<String, String> findAll() {
        return settingRepository.findAll();
    }

    public String findByKey(String key) {
        return settingRepository.findByKey(key);
    }

    public String upsert(String key, String value) {
        settingRepository.upsert(key, value);
        return value;
    }

    public void delete(String key) {
        settingRepository.deleteByKey(key);
    }
}
