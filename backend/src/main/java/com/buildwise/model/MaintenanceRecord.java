package com.buildwise.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "maintenance_records")
public class MaintenanceRecord {
    @Id
    private String id;
    private String recordId;        // e.g. MNT-202601-101
    private String residentId;
    private String residentName;
    private String flatNumber;
    private String building;
    private String monthYear;       // Format: YYYY-MM (e.g. "2026-01") - BST Key
    private double amount;
    private double lateFee;
    private double totalAmount;
    private String paymentStatus;   // PAID, UNPAID, OVERDUE
    private LocalDate paymentDate;
    private LocalDate dueDate;
    private String paymentMethod;   // CASH, UPI, BANK_TRANSFER, CHEQUE
    private String receiptNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
