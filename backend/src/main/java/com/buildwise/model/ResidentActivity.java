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
@Document(collection = "resident_activities")
public class ResidentActivity {
    @Id
    private String id;
    private String activityId;
    private String residentId;
    private String residentName;
    private String flatNumber;
    private String actionType;      // REGISTRATION, STATUS_UPDATE, PAYMENT_RECORDED, COMPLAINT_LOGGED, PROFILE_EDIT
    private String description;
    private String performedBy;
    private LocalDateTime timestamp;
}
