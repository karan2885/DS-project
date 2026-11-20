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
@Document(collection = "society_config")
public class SocietyConfig {
    @Id
    private String id;
    private String societyName;
    private String location;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    private String registrationNumber;
    private String currencySymbol;
    private String currencyCode;
    private double baseMaintenanceAmount;
    private double lateFeeAmount;
    private int lateFeeGraceDays;
    private String currentBillingMonth; // e.g. "2026-03"
    private String contactEmail;
    private String contactPhone;
    private boolean demoDataInitialized;
    private LocalDateTime initializedAt;
    private LocalDateTime lastResetAt;
}
