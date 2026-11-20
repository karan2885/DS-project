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
public class ComplaintAssignmentDTO {
    @NotBlank(message = "Assigned staff member is required")
    private String staffName;

    private String staffContact;

    private String remarks;

    private String assignedBy;
}
