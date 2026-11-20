package com.buildwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetDemoDataResponse {
    private boolean success;
    private String message;
    private int residentsCount;
    private int flatsCount;
    private int maintenanceRecordsCount;
    private int complaintsCount;
    private int visitorsCount;
    private int expensesCount;
    private int noticesCount;
    private LocalDateTime timestamp;
}
