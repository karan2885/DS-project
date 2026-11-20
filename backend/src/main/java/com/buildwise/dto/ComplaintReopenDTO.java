package com.buildwise.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintReopenDTO {
    @NotBlank(message = "Reopening reason is strictly mandatory")
    private String reopenedReason;

    private String reopenedBy;

    private String updatedPriority; // Optional escalation upon reopening
}
