package com.buildwise.datastructures;

import com.buildwise.model.MaintenanceRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Data Structure 6: Binary Search Tree (BST) Tests - Month-Wise Maintenance")
public class BSTTest {

    private MaintenanceBST bst;

    @BeforeEach
    void setUp() {
        bst = new MaintenanceBST();
    }

    @Test
    @DisplayName("Should insert month records and retrieve via search")
    void testInsertAndSearch() {
        MaintenanceRecord r1 = MaintenanceRecord.builder().recordId("R1").monthYear("2026-02").amount(250.0).totalAmount(250.0).paymentStatus("PAID").build();
        MaintenanceRecord r2 = MaintenanceRecord.builder().recordId("R2").monthYear("2026-01").amount(200.0).totalAmount(200.0).paymentStatus("PAID").build();
        MaintenanceRecord r3 = MaintenanceRecord.builder().recordId("R3").monthYear("2026-03").amount(300.0).totalAmount(300.0).paymentStatus("UNPAID").build();

        bst.insert(r1);
        bst.insert(r2);
        bst.insert(r3);

        MaintenanceBST.MonthlySummary jan = bst.search("2026-01");
        assertNotNull(jan);
        assertEquals("2026-01", jan.getMonthYear());
        assertEquals(200.0, jan.getTotalCollected());

        MaintenanceBST.MonthlySummary mar = bst.search("2026-03");
        assertNotNull(mar);
        assertEquals(300.0, mar.getTotalPending());

        assertNull(bst.search("2026-05"));
    }

    @Test
    @DisplayName("Should yield strictly chronological records via Inorder Traversal")
    void testInorderTraversal() {
        // Insert in non-chronological order
        bst.insert(MaintenanceRecord.builder().recordId("R1").monthYear("2026-03").totalAmount(100.0).paymentStatus("PAID").build());
        bst.insert(MaintenanceRecord.builder().recordId("R2").monthYear("2025-11").totalAmount(100.0).paymentStatus("PAID").build());
        bst.insert(MaintenanceRecord.builder().recordId("R3").monthYear("2026-01").totalAmount(100.0).paymentStatus("PAID").build());
        bst.insert(MaintenanceRecord.builder().recordId("R4").monthYear("2025-12").totalAmount(100.0).paymentStatus("PAID").build());
        bst.insert(MaintenanceRecord.builder().recordId("R5").monthYear("2026-02").totalAmount(100.0).paymentStatus("PAID").build());

        List<MaintenanceBST.MonthlySummary> sorted = bst.inOrderTraversal();
        assertEquals(5, sorted.size());

        // Inorder of BST must be sorted ascending
        assertEquals("2025-11", sorted.get(0).getMonthYear());
        assertEquals("2025-12", sorted.get(1).getMonthYear());
        assertEquals("2026-01", sorted.get(2).getMonthYear());
        assertEquals("2026-02", sorted.get(3).getMonthYear());
        assertEquals("2026-03", sorted.get(4).getMonthYear());
    }

    @Test
    @DisplayName("Should execute Range Search between startMonth and endMonth")
    void testRangeSearch() {
        bst.insert(MaintenanceRecord.builder().recordId("R1").monthYear("2025-10").totalAmount(100.0).build());
        bst.insert(MaintenanceRecord.builder().recordId("R2").monthYear("2025-11").totalAmount(100.0).build());
        bst.insert(MaintenanceRecord.builder().recordId("R3").monthYear("2025-12").totalAmount(100.0).build());
        bst.insert(MaintenanceRecord.builder().recordId("R4").monthYear("2026-01").totalAmount(100.0).build());
        bst.insert(MaintenanceRecord.builder().recordId("R5").monthYear("2026-02").totalAmount(100.0).build());

        List<MaintenanceBST.MonthlySummary> range = bst.rangeSearch("2025-11", "2026-01");
        assertEquals(3, range.size());
        assertEquals("2025-11", range.get(0).getMonthYear());
        assertEquals("2025-12", range.get(1).getMonthYear());
        assertEquals("2026-01", range.get(2).getMonthYear());
    }
}
