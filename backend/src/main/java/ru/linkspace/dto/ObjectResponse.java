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
    private String disk;
    private Long fileSize;
    private Instant fileCreatedAt;
    private Instant fileModifiedAt;
    private Double x;
    private Double y;
    private String color;
    private Double width;
    private Double height;
    private String tags;
    private String preview;
    private Integer zIndex;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastOpenedAt;

    public static ObjectResponse from(InformationObject object) {
        ObjectResponse response = new ObjectResponse();
        response.id = object.getId();
        response.title = object.getTitle();
        response.type = object.getType();
        response.description = object.getDescription();
        response.content = object.getContent();
        response.path = object.getPath();
        response.url = object.getUrl();
        response.disk = object.getDisk();
        response.fileSize = object.getFileSize();
        response.fileCreatedAt = object.getFileCreatedAt();
        response.fileModifiedAt = object.getFileModifiedAt();
        response.x = object.getX();
        response.y = object.getY();
        response.color = object.getColor();
        response.width = object.getWidth();
        response.height = object.getHeight();
        response.tags = object.getTags();
        response.preview = object.getPreview();
        response.zIndex = object.getZIndex();
        response.createdAt = object.getCreatedAt();
        response.updatedAt = object.getUpdatedAt();
        response.lastOpenedAt = object.getLastOpenedAt();
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

    public String getDisk() {
        return disk;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public Instant getFileCreatedAt() {
        return fileCreatedAt;
    }

    public Instant getFileModifiedAt() {
        return fileModifiedAt;
    }

    public Double getX() {
        return x;
    }

    public Double getY() {
        return y;
    }

    public String getColor() {
        return color;
    }

    public Double getWidth() {
        return width;
    }

    public Double getHeight() {
        return height;
    }

    public String getTags() {
        return tags;
    }

    public String getPreview() {
        return preview;
    }

    public Integer getZIndex() {
        return zIndex;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getLastOpenedAt() {
        return lastOpenedAt;
    }
}
