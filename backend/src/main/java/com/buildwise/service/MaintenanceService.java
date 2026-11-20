package com.buildwise.service;

import com.buildwise.datastructures.MaintenanceBST;
import com.buildwise.datastructures.PaymentRecordManager;
import com.buildwise.datastructures.ResidentActivityManager;
import com.buildwise.datastructures.UndoManager;
import com.buildwise.model.AdminOperation;
import com.buildwise.model.BuildingNode;
import com.buildwise.model.MaintenanceRecord;
import com.buildwise.model.Resident;
import com.buildwise.model.ResidentActivity;
import com.buildwise.model.SocietyConfig;
import com.buildwise.repository.AdminOperationRepository;
import com.buildwise.repository.BuildingNodeRepository;
import com.buildwise.repository.MaintenanceRepository;
import com.buildwise.repository.ResidentActivityRepository;
import com.buildwise.repository.ResidentRepository;
import com.buildwise.repository.SocietyConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final ResidentActivityRepository residentActivityRepository;
    private final AdminOperationRepository adminOperationRepository;
    private final ResidentRepository residentRepository;
    private final BuildingNodeRepository buildingNodeRepository;
    private final SocietyConfigRepository societyConfigRepository;
    private final PaymentRecordManager paymentRecordManager;
    private final MaintenanceBST maintenanceBST;
    private final ResidentActivityManager residentActivityManager;
    private final UndoManager undoManager;
    private final ObjectMapper objectMapper;

    public List<MaintenanceRecord> getAllMaintenanceRecords() {
        return maintenanceRepository.findAll();
    }

    public Optional<MaintenanceRecord> getById(String id) {
        return maintenanceRepository.findById(id);
    }

    public MaintenanceRecord createRecord(MaintenanceRecord record) {
        if (record.getRecordId() == null || record.getRecordId().isEmpty()) {
            record.setRecordId("MNT-" + System.currentTimeMillis() % 1000000);
        }
        if (record.getDueDate() == null) {
            record.setDueDate(LocalDate.now().plusDays(15));
        }

        // Calculate late fee if overdue
        calculateLateFee(record);

        record.setCreatedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());

        MaintenanceRecord saved = maintenanceRepository.save(record);

        // Synchronize ArrayList
        paymentRecordManager.addPaymentRecord(saved);

        // Synchronize BST
        maintenanceBST.insert(saved);

        return saved;
    }

    public MaintenanceRecord recordPayment(String id, String paymentMethod) {
        MaintenanceRecord record = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Record not found with id: " + id));

        String oldJson = toJson(record);

        record.setPaymentStatus("PAID");
        record.setPaymentDate(LocalDate.now());
        record.setPaymentMethod(paymentMethod != null ? paymentMethod : "UPI");
        record.setReceiptNumber("RCP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        record.setUpdatedAt(LocalDateTime.now());

        MaintenanceRecord saved = maintenanceRepository.save(record);

        // Synchronize in ArrayList
        paymentRecordManager.updatePaymentRecord(saved);

        // Rebuild/Update in BST
        maintenanceBST.rebuild(paymentRecordManager.getAllPayments());

        // Push Undo Operation for accidental payment status update
        recordUndoOperation("MAINTENANCE_STATUS_UPDATE", "MaintenanceRecord", saved.getId(),
                "Marked maintenance as PAID for Flat " + saved.getFlatNumber() + " (" + saved.getMonthYear() + ")",
                oldJson, toJson(saved));

        // Log Resident Activity
        recordActivity(saved, "PAYMENT_RECORDED", "Paid maintenance of ₹" + saved.getTotalAmount() + " for " + saved.getMonthYear());

        return saved;
    }

    public MaintenanceRecord updateRecordStatus(String id, String status) {
        MaintenanceRecord record = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Record not found with id: " + id));

        String oldJson = toJson(record);

        record.setPaymentStatus(status.toUpperCase());
        if ("PAID".equalsIgnoreCase(status) && record.getPaymentDate() == null) {
            record.setPaymentDate(LocalDate.now());
            record.setReceiptNumber("RCP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        calculateLateFee(record);
        record.setUpdatedAt(LocalDateTime.now());

        MaintenanceRecord saved = maintenanceRepository.save(record);

        paymentRecordManager.updatePaymentRecord(saved);
        maintenanceBST.rebuild(paymentRecordManager.getAllPayments());

        recordUndoOperation("MAINTENANCE_STATUS_UPDATE", "MaintenanceRecord", saved.getId(),
                "Updated maintenance status to " + status + " for Flat " + saved.getFlatNumber() + " (" + saved.getMonthYear() + ")",
                oldJson, toJson(saved));

        return saved;
    }

    public void restoreRecord(MaintenanceRecord restored) {
        restored.setUpdatedAt(LocalDateTime.now());
        MaintenanceRecord saved = maintenanceRepository.save(restored);
        paymentRecordManager.updatePaymentRecord(saved);
        maintenanceBST.rebuild(paymentRecordManager.getAllPayments());
        log.info("Restored maintenance record: {}", saved.getRecordId());
    }

    public void calculateLateFee(MaintenanceRecord record) {
        if ("PAID".equalsIgnoreCase(record.getPaymentStatus())) {
            record.setTotalAmount(record.getAmount() + record.getLateFee());
            return;
        }

        if (record.getDueDate() != null && LocalDate.now().isAfter(record.getDueDate())) {
            record.setPaymentStatus("OVERDUE");
            record.setLateFee(250.0); // Standard ₹250 late fee in INR
            record.setTotalAmount(record.getAmount() + 250.0);
        } else {
            record.setTotalAmount(record.getAmount() + record.getLateFee());
        }
    }

    public List<MaintenanceRecord> filterRecords(String monthYear, String building, String status) {
        List<MaintenanceRecord> all = paymentRecordManager.getAllPayments();
        return all.stream()
                .filter(r -> monthYear == null || monthYear.isBlank() || "ALL".equalsIgnoreCase(monthYear) || monthYear.equalsIgnoreCase(r.getMonthYear()))
                .filter(r -> building == null || building.isBlank() || "ALL".equalsIgnoreCase(building) || building.equalsIgnoreCase(r.getBuilding()))
                .filter(r -> status == null || status.isBlank() || "ALL".equalsIgnoreCase(status) || status.equalsIgnoreCase(r.getPaymentStatus()))
                .collect(Collectors.toList());
    }

    public Map<String, Object> generateMonthlyReport(String monthYear) {
        // Leverages BST search if month is provided
        if (monthYear != null && !monthYear.isBlank()) {
            MaintenanceBST.MonthlySummary bstSummary = maintenanceBST.search(monthYear);
            if (bstSummary != null) {
                Map<String, Object> rep = new HashMap<>();
                rep.put("monthYear", bstSummary.getMonthYear());
                rep.put("collectedAmount", bstSummary.getTotalCollected());
                rep.put("pendingAmount", bstSummary.getTotalPending());
                rep.put("paidCount", bstSummary.getPaidCount());
                rep.put("pendingCount", bstSummary.getPendingCount());
                rep.put("totalRecordsInMonth", bstSummary.getTotalRecords());
                rep.put("records", bstSummary.getRecords());
                return rep;
            }
        }
        // Fallback to ArrayList report manager
        return paymentRecordManager.generateMonthlyFinancialReport(monthYear);
    }

    public List<MaintenanceBST.MonthlySummary> getChronologicalMonthlyReports() {
        // BST Inorder Traversal guaranteed strictly chronological
        return maintenanceBST.inOrderTraversal();
    }

    public List<MaintenanceBST.MonthlySummary> getRangeMonthlyReports(String startMonth, String endMonth) {
        // BST Range Search
        return maintenanceBST.rangeSearch(startMonth, endMonth);
    }

    public List<String> getAllAvailableMonths() {
        return paymentRecordManager.getAllPayments().stream()
                .map(MaintenanceRecord::getMonthYear)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());
    }

    public Map<String, Object> changeBillingMonth(String targetMonth) {
        SocietyConfig config = societyConfigRepository.findFirstByOrderByIdAsc()
                .orElse(SocietyConfig.builder()
                        .societyName("Green Valley Residency")
                        .baseMaintenanceAmount(2500.0)
                        .lateFeeAmount(250.0)
                        .currentBillingMonth("2026-03")
                        .build());

        String currentMonth = config.getCurrentBillingMonth() != null ? config.getCurrentBillingMonth() : "2026-03";

        String newMonth;
        if (targetMonth == null || targetMonth.isBlank()) {
            try {
                YearMonth ym = YearMonth.parse(currentMonth);
                newMonth = ym.plusMonths(1).toString();
            } catch (Exception e) {
                newMonth = "2026-04";
            }
        } else {
            newMonth = targetMonth.trim();
        }

        double baseAmount = config.getBaseMaintenanceAmount() > 0 ? config.getBaseMaintenanceAmount() : 2500.0;

        List<Resident> allResidents = residentRepository.findAll();
        Map<String, Resident> flatToResident = new HashMap<>();
        for (Resident r : allResidents) {
            if (r.getFlatNumber() != null) {
                flatToResident.put(r.getFlatNumber().trim().toUpperCase(), r);
            }
        }

        List<BuildingNode> allFlats = buildingNodeRepository.findByType("FLAT");
        List<String> flatList = new ArrayList<>();
        if (!allFlats.isEmpty()) {
            for (BuildingNode n : allFlats) {
                flatList.add(n.getNodeId());
            }
        } else {
            for (Resident r : allResidents) {
                if (r.getFlatNumber() != null && !flatList.contains(r.getFlatNumber())) {
                    flatList.add(r.getFlatNumber());
                }
            }
        }

        // If still empty (edge case), generate standard 48 flats for A, B, C Wings
        if (flatList.isEmpty()) {
            for (char w : new char[]{'A', 'B', 'C'}) {
                for (int f = 1; f <= 4; f++) {
                    for (int n = 1; n <= 4; n++) {
                        flatList.add(w + "-" + f + String.format("%02d", n));
                    }
                }
            }
        }

        List<MaintenanceRecord> existingForNewMonth = maintenanceRepository.findByMonthYear(newMonth);
        Map<String, MaintenanceRecord> existingMap = existingForNewMonth.stream()
                .collect(Collectors.toMap(MaintenanceRecord::getFlatNumber, r -> r, (a, b) -> a));

        List<MaintenanceRecord> recordsToSave = new ArrayList<>();
        int count = 1;
        LocalDate dueDate;
        try {
            dueDate = LocalDate.parse(newMonth + "-15");
        } catch (Exception e) {
            dueDate = LocalDate.now().plusDays(15);
        }

        for (String flat : flatList) {
            Resident resident = flatToResident.get(flat.toUpperCase());
            String wing = resident != null && resident.getBuilding() != null 
                    ? resident.getBuilding() 
                    : (flat.startsWith("A") ? "A Wing" : (flat.startsWith("B") ? "B Wing" : "C Wing"));
            String resName = resident != null ? resident.getName() : "Resident of Flat " + flat;
            String resId = resident != null ? resident.getResidentId() : "RES-" + flat.replace("-", "");

            MaintenanceRecord rec = existingMap.get(flat);
            if (rec == null) {
                rec = MaintenanceRecord.builder()
                        .recordId("MNT-" + newMonth.replace("-", "") + "-" + String.format("%04d", count++))
                        .residentId(resId)
                        .residentName(resName)
                        .flatNumber(flat)
                        .building(wing)
                        .monthYear(newMonth)
                        .amount(baseAmount)
                        .lateFee(0.0)
                        .totalAmount(baseAmount)
                        .paymentStatus("UNPAID") // All flats are pending to pay maintenance!
                        .dueDate(dueDate)
                        .paymentDate(null)
                        .paymentMethod(null)
                        .receiptNumber(null)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
            } else {
                rec.setPaymentStatus("UNPAID");
                rec.setPaymentDate(null);
                rec.setPaymentMethod(null);
                rec.setReceiptNumber(null);
                rec.setLateFee(0.0);
                rec.setTotalAmount(rec.getAmount() > 0 ? rec.getAmount() : baseAmount);
                rec.setUpdatedAt(LocalDateTime.now());
            }
            recordsToSave.add(rec);
        }

        maintenanceRepository.saveAll(recordsToSave);

        // Update SocietyConfig
        config.setCurrentBillingMonth(newMonth);
        societyConfigRepository.save(config);

        // Synchronize ArrayList (Data Structure 1)
        List<MaintenanceRecord> allPayments = maintenanceRepository.findAll();
        paymentRecordManager.setPaymentRecords(allPayments);

        // Synchronize BST (Data Structure 6)
        maintenanceBST.rebuild(allPayments);

        // Log to LinkedList Activity (Data Structure 2)
        ResidentActivity act = ResidentActivity.builder()
                .activityId("ACT-BILL-" + UUID.randomUUID().toString().substring(0, 8))
                .residentId("SYSTEM")
                .residentName("Society Administration")
                .flatNumber("ALL")
                .actionType("BILLING_MONTH_ADVANCED")
                .description("Advanced billing month to " + newMonth + ". Generated " + recordsToSave.size() + " maintenance dues. All flats pending.")
                .performedBy("Admin")
                .timestamp(LocalDateTime.now())
                .build();
        residentActivityRepository.save(act);
        residentActivityManager.addActivity(act);

        // Record Undo Stack (Data Structure 3)
        recordUndoOperation("MONTH_ADVANCED", "SocietyConfig", config.getId(),
                "Changed billing cycle to " + newMonth + " (Generated " + recordsToSave.size() + " pending invoices)",
                currentMonth, newMonth);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("previousMonth", currentMonth);
        result.put("currentBillingMonth", newMonth);
        result.put("totalFlatsInvoiced", recordsToSave.size());
        result.put("totalPendingAmount", recordsToSave.size() * baseAmount);
        result.put("message", "Successfully changed billing month to " + newMonth + ". All " + recordsToSave.size() + " flats are now pending maintenance.");
        return result;
    }

    public Map<String, Object> markAllFlatsPaidForMonth(String monthYear) {
        if (monthYear == null || monthYear.isBlank()) {
            SocietyConfig config = societyConfigRepository.findFirstByOrderByIdAsc().orElse(null);
            monthYear = config != null && config.getCurrentBillingMonth() != null ? config.getCurrentBillingMonth() : "2026-03";
        }

        List<MaintenanceRecord> records = maintenanceRepository.findByMonthYear(monthYear);
        int updatedCount = 0;
        int rcpIndex = 1;
        for (MaintenanceRecord r : records) {
            if (!"PAID".equalsIgnoreCase(r.getPaymentStatus())) {
                r.setPaymentStatus("PAID");
                r.setPaymentDate(LocalDate.now());
                r.setPaymentMethod("UPI");
                r.setReceiptNumber("GVR-RCP-" + monthYear.replace("-", "") + "-" + String.format("%04d", rcpIndex++));
                r.setUpdatedAt(LocalDateTime.now());
                updatedCount++;
            }
        }
        if (updatedCount > 0) {
            maintenanceRepository.saveAll(records);
            List<MaintenanceRecord> allPayments = maintenanceRepository.findAll();
            paymentRecordManager.setPaymentRecords(allPayments);
            maintenanceBST.rebuild(allPayments);

            ResidentActivity act = ResidentActivity.builder()
                    .activityId("ACT-PAYALL-" + UUID.randomUUID().toString().substring(0, 8))
                    .residentId("SYSTEM")
                    .residentName("Society Administration")
                    .flatNumber("ALL")
                    .actionType("BULK_PAYMENT_COLLECTED")
                    .description("Marked all " + records.size() + " flats as PAID for month " + monthYear)
                    .performedBy("Admin")
                    .timestamp(LocalDateTime.now())
                    .build();
            residentActivityRepository.save(act);
            residentActivityManager.addActivity(act);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("monthYear", monthYear);
        result.put("totalFlatsPaid", records.size());
        result.put("message", "All flats for " + monthYear + " are now marked as PAID (100% Maintenance Collected).");
        return result;
    }

    private void recordActivity(MaintenanceRecord record, String type, String desc) {
        ResidentActivity activity = ResidentActivity.builder()
                .activityId("ACT-" + UUID.randomUUID().toString().substring(0, 8))
                .residentId(record.getResidentId())
                .residentName(record.getResidentName())
                .flatNumber(record.getFlatNumber())
                .actionType(type)
                .description(desc)
                .performedBy("Resident / System")
                .timestamp(LocalDateTime.now())
                .build();
        residentActivityRepository.save(activity);
        residentActivityManager.addActivity(activity);
    }

    private void recordUndoOperation(String opType, String entityType, String entityId, String desc, String prevJson, String updatedJson) {
        AdminOperation op = AdminOperation.builder()
                .operationId("OP-" + UUID.randomUUID().toString().substring(0, 8))
                .operationType(opType)
                .entityType(entityType)
                .entityId(entityId)
                .description(desc)
                .previousStateJson(prevJson)
                .updatedStateJson(updatedJson)
                .timestamp(LocalDateTime.now())
                .undone(false)
                .build();
        adminOperationRepository.save(op);
        undoManager.pushOperation(op);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "";
        }
    }
}
