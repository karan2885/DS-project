package com.buildwise.controller;

import com.buildwise.datastructures.MaintenanceBST;
import com.buildwise.datastructures.PaymentRecordManager;
import com.buildwise.datastructures.ResidentActivityManager;
import com.buildwise.dto.DashboardStatsDto;
import com.buildwise.model.Complaint;
import com.buildwise.model.Resident;
import com.buildwise.model.ResidentActivity;
import com.buildwise.model.SocietyConfig;
import com.buildwise.repository.BuildingNodeRepository;
import com.buildwise.repository.ComplaintRepository;
import com.buildwise.repository.ResidentRepository;
import com.buildwise.repository.SocietyConfigRepository;
import com.buildwise.repository.VisitorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final ResidentRepository residentRepository;
    private final ComplaintRepository complaintRepository;
    private final VisitorRepository visitorRepository;
    private final BuildingNodeRepository buildingNodeRepository;
    private final SocietyConfigRepository societyConfigRepository;
    private final PaymentRecordManager paymentRecordManager;
    private final ResidentActivityManager residentActivityManager;
    private final MaintenanceBST maintenanceBST;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        List<Resident> activeResidents = residentRepository.findByActive(true);
        int totalResidents = activeResidents.size();
        
        // Count occupied flats uniquely
        long occupiedFlats = activeResidents.stream()
                .map(Resident::getFlatNumber)
                .filter(f -> f != null && !f.isBlank())
                .distinct()
                .count();

        // Count total flats registered in building hierarchy
        long totalFlatsCount = buildingNodeRepository.findByType("FLAT").size();
        int totalFlats = totalFlatsCount > 0 ? (int) totalFlatsCount : 48;

        double collected = paymentRecordManager.calculateTotalMaintenanceCollected();
        double pending = paymentRecordManager.calculateTotalPendingMaintenance();
        double expenses = paymentRecordManager.calculateTotalExpenses();

        List<Complaint> allComplaints = complaintRepository.findAll();
        int openComplaints = (int) allComplaints.stream()
                .filter(c -> "SUBMITTED".equalsIgnoreCase(c.getStatus()) || "REOPENED".equalsIgnoreCase(c.getStatus()))
                .count();
        int inProgress = (int) allComplaints.stream()
                .filter(c -> "ASSIGNED".equalsIgnoreCase(c.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(c.getStatus()))
                .count();
        int resolved = (int) allComplaints.stream()
                .filter(c -> "RESOLVED".equalsIgnoreCase(c.getStatus()))
                .count();
        int closed = (int) allComplaints.stream()
                .filter(c -> "CLOSED".equalsIgnoreCase(c.getStatus()))
                .count();
        int highPriority = (int) allComplaints.stream()
                .filter(c -> ("HIGH".equalsIgnoreCase(c.getPriority()) || "CRITICAL".equalsIgnoreCase(c.getPriority())) && 
                             !"RESOLVED".equalsIgnoreCase(c.getStatus()) && !"CLOSED".equalsIgnoreCase(c.getStatus()))
                .count();

        int activeVisitors = (int) visitorRepository.findByStatus("ACTIVE").size();

        // Recent activities from LinkedList
        List<ResidentActivity> recentList = residentActivityManager.getRecentActivities(6);
        List<Map<String, Object>> recentActs = new ArrayList<>();
        for (ResidentActivity a : recentList) {
            Map<String, Object> map = new HashMap<>();
            map.put("activityId", a.getActivityId());
            map.put("residentName", a.getResidentName());
            map.put("flatNumber", a.getFlatNumber());
            map.put("actionType", a.getActionType());
            map.put("description", a.getDescription());
            map.put("timestamp", a.getTimestamp());
            recentActs.add(map);
        }

        // Monthly trends from BST Inorder Traversal
        List<MaintenanceBST.MonthlySummary> bstSummaries = maintenanceBST.inOrderTraversal();
        List<Map<String, Object>> trends = new ArrayList<>();
        for (MaintenanceBST.MonthlySummary s : bstSummaries) {
            Map<String, Object> t = new HashMap<>();
            t.put("month", s.getMonthYear());
            t.put("collected", s.getTotalCollected());
            t.put("pending", s.getTotalPending());
            trends.add(t);
        }

        DashboardStatsDto dto = DashboardStatsDto.builder()
                .totalFlats(totalFlats)
                .occupiedFlats((int) occupiedFlats)
                .totalResidents(totalResidents)
                .maintenanceCollected(collected)
                .pendingMaintenance(pending)
                .openComplaints(openComplaints)
                .inProgressComplaints(inProgress)
                .resolvedComplaints(resolved)
                .closedComplaints(closed)
                .highPriorityComplaints(highPriority)
                .activeVisitors(activeVisitors)
                .totalExpenses(expenses)
                .netBalance(collected - expenses)
                .currencySymbol("₹")
                .currentBillingMonth(societyConfigRepository.findFirstByOrderByIdAsc()
                        .map(SocietyConfig::getCurrentBillingMonth)
                        .orElse("2026-03"))
                .societyName("Green Valley Residency")
                .societyLocation("Vesu, Surat, Gujarat, India")
                .recentActivities(recentActs)
                .monthlyFinancialTrends(trends)
                .build();

        return ResponseEntity.ok(dto);
    }
}
