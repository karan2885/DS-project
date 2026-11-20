package com.buildwise.datastructures;

import com.buildwise.model.Expense;
import com.buildwise.model.MaintenanceRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Data Structure 1: ArrayList Tests - Payments & Expenses")
public class ArrayListTest {

    private PaymentRecordManager manager;

    @BeforeEach
    void setUp() {
        manager = new PaymentRecordManager();
    }

    @Test
    @DisplayName("Should add, retrieve, and iterate over payment records")
    void testAddAndRetrievePayments() {
        MaintenanceRecord r1 = MaintenanceRecord.builder()
                .recordId("MNT-1")
                .monthYear("2026-01")
                .amount(200.0)
                .totalAmount(200.0)
                .paymentStatus("PAID")
                .build();
        MaintenanceRecord r2 = MaintenanceRecord.builder()
                .recordId("MNT-2")
                .monthYear("2026-01")
                .amount(300.0)
                .totalAmount(300.0)
                .paymentStatus("UNPAID")
                .build();

        manager.addPaymentRecord(r1);
        manager.addPaymentRecord(r2);

        List<MaintenanceRecord> all = manager.getAllPayments();
        assertEquals(2, all.size());
        assertEquals("MNT-1", all.get(0).getRecordId());
        assertEquals("MNT-2", all.get(1).getRecordId());

        // Calculation tests
        assertEquals(200.0, manager.calculateTotalMaintenanceCollected());
        assertEquals(300.0, manager.calculateTotalPendingMaintenance());
    }

    @Test
    @DisplayName("Should filter payments by month and generate financial report")
    void testFilterAndReport() {
        manager.addPaymentRecord(MaintenanceRecord.builder().recordId("MNT-01").monthYear("2026-01").amount(500.0).totalAmount(500.0).paymentStatus("PAID").build());
        manager.addPaymentRecord(MaintenanceRecord.builder().recordId("MNT-02").monthYear("2026-02").amount(600.0).totalAmount(600.0).paymentStatus("PAID").build());
        manager.addExpenseRecord(Expense.builder().expenseId("EXP-01").category("Cleaning").amount(150.0).expenseDate(LocalDate.of(2026, 1, 10)).build());

        List<MaintenanceRecord> janPayments = manager.filterPaymentsByMonth("2026-01");
        assertEquals(1, janPayments.size());
        assertEquals("MNT-01", janPayments.get(0).getRecordId());

        Map<String, Object> report = manager.generateMonthlyFinancialReport("2026-01");
        assertEquals("2026-01", report.get("monthYear"));
        assertEquals(500.0, report.get("collectedAmount"));
        assertEquals(150.0, report.get("totalExpenseAmount"));
        assertEquals(350.0, report.get("netBalance"));
    }
}
