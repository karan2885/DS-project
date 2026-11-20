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
@Document(collection = "residents")
public class Resident {
    @Id
    private String id;
    private String residentId;     // e.g. RES-1001
    private String name;
    private String flatNumber;     // e.g. A-101 (used as key for AVL tree)
    private String building;       // e.g. Tower A
    private String contactNumber;
    private String email;
    private String occupancyStatus; // OWNER, TENANT, VACANT
    private String moveInDate;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
