package ru.linkspace.dto;

import jakarta.validation.constraints.NotNull;

public class ConnectionRequest {

    @NotNull
    private Long sourceId;

    @NotNull
    private Long targetId;

    private String label;

    public Long getSourceId() {
        return sourceId;
    }

    public void setSourceId(Long sourceId) {
        this.sourceId = sourceId;
    }

    public Long getTargetId() {
        return targetId;
    }

    public void setTargetId(Long targetId) {
        this.targetId = targetId;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}
