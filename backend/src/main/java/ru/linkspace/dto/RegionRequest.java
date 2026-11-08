package ru.linkspace.dto;

import jakarta.validation.constraints.NotBlank;

public class RegionRequest {

    @NotBlank
    private String name;

    private String color;
    private String coordinates;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getCoordinates() {
        return coordinates;
    }

    public void setCoordinates(String coordinates) {
        this.coordinates = coordinates;
    }
}
