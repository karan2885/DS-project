package com.buildwise.controller;

import com.buildwise.config.DemoDataInitializer;
import com.buildwise.dto.ResetDemoDataResponse;
import com.buildwise.model.SocietyConfig;
import com.buildwise.repository.SocietyConfigRepository;
import com.buildwise.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final DemoDataInitializer demoDataInitializer;
    private final SocietyConfigRepository societyConfigRepository;
    private final MaintenanceService maintenanceService;

    @PostMapping("/reset-demo-data")
    public ResponseEntity<ResetDemoDataResponse> resetDemoData() {
        return ResponseEntity.ok(demoDataInitializer.resetAndReseedDemoData());
    }

    @PostMapping("/change-billing-month")
    public ResponseEntity<Map<String, Object>> changeBillingMonth(@RequestParam(required = false) String month) {
        return ResponseEntity.ok(maintenanceService.changeBillingMonth(month));
    }

    @PostMapping("/mark-all-paid")
    public ResponseEntity<Map<String, Object>> markAllFlatsPaidForMonth(@RequestParam(required = false) String month) {
        return ResponseEntity.ok(maintenanceService.markAllFlatsPaidForMonth(month));
    }

    @GetMapping("/society-info")
    public ResponseEntity<SocietyConfig> getSocietyInfo() {
        return societyConfigRepository.findFirstByOrderByIdAsc()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(SocietyConfig.builder()
                        .societyName("Green Valley Residency")
                        .location("Vesu, Surat, Gujarat, India")
                        .address("Plot No. 12-16, VIP Road, Near GD Goenka School, Vesu")
                        .city("Surat")
                        .state("Gujarat")
                        .postalCode("395007")
                        .registrationNumber("GUJ/SRT/HSG/2022/4921")
                        .currencySymbol("₹")
                        .currencyCode("INR")
                        .baseMaintenanceAmount(2500.0)
                        .lateFeeAmount(250.0)
                        .currentBillingMonth("2026-03")
                        .build()));
    }
}
