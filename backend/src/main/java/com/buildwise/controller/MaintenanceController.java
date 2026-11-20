package com.buildwise.controller;

import com.buildwise.datastructures.MaintenanceBST;
import com.buildwise.model.MaintenanceRecord;
import com.buildwise.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @GetMapping
    public ResponseEntity<List<MaintenanceRecord>> getRecords(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(maintenanceService.filterRecords(month, building, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceRecord> getById(@PathVariable String id) {
        return maintenanceService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MaintenanceRecord> createRecord(@RequestBody MaintenanceRecord record) {
        return ResponseEntity.ok(maintenanceService.createRecord(record));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<MaintenanceRecord> recordPayment(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "UPI") String paymentMethod) {
        return ResponseEntity.ok(maintenanceService.recordPayment(id, paymentMethod));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MaintenanceRecord> updateStatus(
            @PathVariable String id,
            @RequestParam String status) {
        return ResponseEntity.ok(maintenanceService.updateRecordStatus(id, status));
    }

    @GetMapping("/monthly-report")
    public ResponseEntity<Map<String, Object>> getMonthlyReport(@RequestParam(required = false) String month) {
        return ResponseEntity.ok(maintenanceService.generateMonthlyReport(month));
    }

    @GetMapping("/chronological-reports")
    public ResponseEntity<List<MaintenanceBST.MonthlySummary>> getChronologicalReports() {
        return ResponseEntity.ok(maintenanceService.getChronologicalMonthlyReports());
    }

    @GetMapping("/range-reports")
    public ResponseEntity<List<MaintenanceBST.MonthlySummary>> getRangeReports(
            @RequestParam String startMonth,
            @RequestParam String endMonth) {
        return ResponseEntity.ok(maintenanceService.getRangeMonthlyReports(startMonth, endMonth));
    }

    @GetMapping("/months")
    public ResponseEntity<List<String>> getAllAvailableMonths() {
        return ResponseEntity.ok(maintenanceService.getAllAvailableMonths());
    }

    @PostMapping("/change-billing-month")
    public ResponseEntity<Map<String, Object>> changeBillingMonth(@RequestParam(required = false) String month) {
        return ResponseEntity.ok(maintenanceService.changeBillingMonth(month));
    }

    @PostMapping("/mark-all-paid")
    public ResponseEntity<Map<String, Object>> markAllFlatsPaidForMonth(@RequestParam(required = false) String month) {
        return ResponseEntity.ok(maintenanceService.markAllFlatsPaidForMonth(month));
    }
}
