package com.buildwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private int totalFlats;
    private int occupiedFlats;
    private int totalResidents;
    private double maintenanceCollected;
    private double pendingMaintenance;
    private int openComplaints;
    private int inProgressComplaints;
    private int resolvedComplaints;
    private int closedComplaints;
    private int highPriorityComplaints;
    private int activeVisitors;
    private double totalExpenses;
    private double netBalance;
    private String currencySymbol;
    private String currentBillingMonth;
    private String societyName;
    private String societyLocation;
    private List<Map<String, Object>> recentActivities;
    private List<Map<String, Object>> monthlyFinancialTrends;
}
