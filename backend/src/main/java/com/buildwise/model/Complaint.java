package com.buildwise.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "complaints")
public class Complaint {
    @Id
    private String id;
    private String complaintId;        // e.g. CMP-2026-101
    private String residentId;
    private String residentName;
    private String flatNumber;
    private String building;          // A Wing, B Wing, C Wing
    private String category;          // PLUMBING, ELECTRICITY, LIFT, CLEANING, SECURITY, PARKING, WATER_SUPPLY, OTHER
    private String priority;          // CRITICAL, HIGH, MEDIUM, LOW
    private String status;            // SUBMITTED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REOPENED
    private String title;             // Summary title of complaint
    private String description;
    
    // Assignment Details
    private String assignedStaff;     // Assigned technician or staff name
    private String staffContact;      // Mobile number of assigned staff
    private LocalDateTime assignedDate;

    // Resolution Details
    private String resolutionDescription;
    private String workPerformed;
    private String resolvedBy;
    private LocalDateTime resolvedTime;

    // Closure Details (Mandatory Closure Reason)
    private String closureReason;     // Mandatory explanation when closing
    private String closedBy;          // Admin who authorized closure
    private LocalDateTime closureTime;

    // Reopening Details
    private String reopenedReason;    // Mandatory explanation when reopening
    private String reopenedBy;
    private LocalDateTime reopenedTime;

    // Attachment
    private String attachmentUrl;

    private LocalDateTime submissionTime;

    @Builder.Default
    private List<ComplaintActivity> activityHistory = new ArrayList<>();
}
