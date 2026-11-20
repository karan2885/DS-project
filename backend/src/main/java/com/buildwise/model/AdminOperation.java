package com.buildwise.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "admin_operations")
public class AdminOperation {
    @Id
    private String id;
    private String operationId;       // e.g. OP-1001
    private String operationType;     // RESIDENT_DELETE, RESIDENT_STATUS_CHANGE, MAINTENANCE_STATUS_UPDATE, NOTICE_DELETE, COMPLAINT_STATUS_CHANGE
    private String entityType;        // Resident, MaintenanceRecord, Notice, Complaint
    private String entityId;          // Target entity identifier
    private String description;       // Human-readable summary e.g. "Deleted resident John Doe from Flat A-101"
    private String previousStateJson; // JSON snapshot of previous state
    private String updatedStateJson;  // JSON snapshot of new state (null if deleted)
    private LocalDateTime timestamp;
    private boolean undone;
}
