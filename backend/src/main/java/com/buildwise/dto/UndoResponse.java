package com.buildwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UndoResponse {
    private boolean success;
    private String message;
    private String operationType;
    private String entityType;
    private String entityId;
    private int remainingUndoStackSize;
}
