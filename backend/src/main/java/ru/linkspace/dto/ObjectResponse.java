package ru.linkspace.dto;

import java.time.Instant;
import ru.linkspace.model.InformationObject;

public class ObjectResponse {

    private Long id;
    private String title;
    private String type;
    private String description;
    private String content;
    private String path;
    private String url;
    private Double x;
    private Double y;
    private Instant createdAt;
    private Instant updatedAt;

    public static ObjectResponse from(InformationObject object) {
        ObjectResponse response = new ObjectResponse();
        response.id = object.getId();
        response.title = object.getTitle();
        response.type = object.getType();
        response.description = object.getDescription();
        response.content = object.getContent();
        response.path = object.getPath();
        response.url = object.getUrl();
        response.x = object.getX();
        response.y = object.getY();
        response.createdAt = object.getCreatedAt();
        response.updatedAt = object.getUpdatedAt();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    public String getContent() {
        return content;
    }

    public String getPath() {
        return path;
    }

    public String getUrl() {
        return url;
    }

    public Double getX() {
        return x;
    }

    public Double getY() {
        return y;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
