package ru.linkspace.dto;

import jakarta.validation.constraints.NotBlank;

public class SettingRequest {

    @NotBlank
    private String value;

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
