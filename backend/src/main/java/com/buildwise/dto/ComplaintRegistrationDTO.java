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
public class ComplaintRegistrationDTO {
    @NotBlank(message = "Resident name is required")
    private String residentName;

    @NotBlank(message = "Flat number is required")
    private String flatNumber;

    private String building; // A Wing, B Wing, C Wing

    @NotBlank(message = "Category is required")
    private String category; // PLUMBING, ELECTRICITY, LIFT, CLEANING, SECURITY, PARKING, WATER_SUPPLY, OTHER

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private String priority; // CRITICAL, HIGH, MEDIUM, LOW

    private String attachmentUrl;
}
