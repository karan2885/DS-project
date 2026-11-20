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
public class ComplaintClosureDTO {
    @NotBlank(message = "Closure reason is strictly mandatory")
    private String closureReason;

    private String closedBy; // Admin user

    private String closureCategory; // RESOLVED_SATISFIED, DUPLICATE_MERGED, WITHDRAWN_BY_RESIDENT, OTHER
}
