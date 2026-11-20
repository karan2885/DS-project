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
@Document(collection = "visitors")
public class Visitor {
    @Id
    private String id;
    private String visitorId;       // e.g. VIS-1001
    private String name;
    private String phone;
    private String visitingFlat;    // e.g. A-101
    private String purpose;         // Delivery, Guest, Service, Maintenance
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private String status;          // ACTIVE, CHECKED_OUT
    private String vehicleNumber;
    private String securityGuard;
    private LocalDateTime createdAt;
}
