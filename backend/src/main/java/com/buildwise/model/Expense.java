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
@Document(collection = "expenses")
public class Expense {
    @Id
    private String id;
    private String expenseId;     // e.g. EXP-2026-001
    private String category;      // Maintenance, Security, Cleaning, Utilities, Landscaping, Administrative
    private double amount;
    private LocalDate expenseDate;
    private String description;
    private String paidTo;
    private String paymentMethod; // CASH, BANK_TRANSFER, UPI, CHEQUE
    private String approvedBy;
    private LocalDateTime createdAt;
}
