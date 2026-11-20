package com.buildwise.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintActivity {
    private String activityId;
    private String complaintId;
    private String action;        // e.g. "Complaint Submitted", "Assigned to Staff", "Work in Progress", "Resolved"
    private String performedBy;   // Resident or Admin Name
    private LocalDateTime timestamp;
    private String remarks;
}
