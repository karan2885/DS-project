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
public class ComplaintResolutionDTO {
    @NotBlank(message = "Resolution description is required")
    private String resolutionDescription;

    @NotBlank(message = "Work performed details are required")
    private String workPerformed;

    private String resolvedBy;

    private String remarks;

    private String attachmentUrl;
}
