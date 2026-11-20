package com.buildwise.datastructures;

import com.buildwise.model.MaintenanceRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Data Structure 6: Custom Binary Search Tree (BST)
 * Application: Month-Wise Maintenance Records & Chronological Reporting
 * 
 * Demonstrates:
 * - Custom BST Node and Pointer implementation (no built-in tree library)
 * - Chronological Year-Month keys (YYYY-MM) with natural lexicographical comparison
 * - Inorder traversal producing strictly chronological financial reports
 * - Range queries [startMonth, endMonth] using BST properties
 */
@Component
public class MaintenanceBST {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlySummary {
        private String monthYear;        // BST Key, e.g. "2026-01"
        private double totalCollected;
        private double totalPending;
        private int totalRecords;
        private int paidCount;
        private int pendingCount;
        @Builder.Default
        private List<MaintenanceRecord> records = new ArrayList<>();
    }

    public static class BSTNode {
        public String key;               // YYYY-MM
        public MonthlySummary summary;
        public BSTNode left;
        public BSTNode right;

        public BSTNode(String key) {
            this.key = key;
            this.summary = MonthlySummary.builder()
                    .monthYear(key)
                    .totalCollected(0.0)
                    .totalPending(0.0)
                    .totalRecords(0)
                    .paidCount(0)
                    .pendingCount(0)
                    .records(new ArrayList<>())
                    .build();
        }

        public void addRecord(MaintenanceRecord record) {
            this.summary.getRecords().add(record);
            this.summary.setTotalRecords(this.summary.getTotalRecords() + 1);
            if ("PAID".equalsIgnoreCase(record.getPaymentStatus())) {
                this.summary.setTotalCollected(this.summary.getTotalCollected() + record.getTotalAmount());
                this.summary.setPaidCount(this.summary.getPaidCount() + 1);
            } else {
                this.summary.setTotalPending(this.summary.getTotalPending() + record.getTotalAmount());
                this.summary.setPendingCount(this.summary.getPendingCount() + 1);
            }
        }
    }

    private BSTNode root;
    private int nodeCount = 0;

    public synchronized void clear() {
        this.root = null;
        this.nodeCount = 0;
    }

    public synchronized void insert(MaintenanceRecord record) {
        if (record == null || record.getMonthYear() == null) return;
        String key = record.getMonthYear().trim();
        root = insertRecursive(root, key, record);
    }

    private BSTNode insertRecursive(BSTNode current, String key, MaintenanceRecord record) {
        if (current == null) {
            BSTNode newNode = new BSTNode(key);
            newNode.addRecord(record);
            nodeCount++;
            return newNode;
        }

        int cmp = key.compareTo(current.key);
        if (cmp < 0) {
            current.left = insertRecursive(current.left, key, record);
        } else if (cmp > 0) {
            current.right = insertRecursive(current.right, key, record);
        } else {
            // Node for this monthYear exists: aggregate record into monthly summary
            current.addRecord(record);
        }
        return current;
    }

    public synchronized MonthlySummary search(String monthYear) {
        if (monthYear == null) return null;
        BSTNode node = searchRecursive(root, monthYear.trim());
        return node != null ? node.summary : null;
    }

    private BSTNode searchRecursive(BSTNode current, String key) {
        if (current == null || current.key.equals(key)) {
            return current;
        }
        if (key.compareTo(current.key) < 0) {
            return searchRecursive(current.left, key);
        }
        return searchRecursive(current.right, key);
    }

    /**
     * Inorder Traversal (Left, Root, Right)
     * For a BST keyed on YYYY-MM, Inorder Traversal produces records in ascending chronological order!
     */
    public synchronized List<MonthlySummary> inOrderTraversal() {
        List<MonthlySummary> result = new ArrayList<>();
        inOrderRecursive(root, result);
        return result;
    }

    private void inOrderRecursive(BSTNode node, List<MonthlySummary> result) {
        if (node != null) {
            inOrderRecursive(node.left, result);
            result.add(node.summary);
            inOrderRecursive(node.right, result);
        }
    }

    /**
     * Range Query: retrieves monthly summaries where startMonth <= monthYear <= endMonth
     */
    public synchronized List<MonthlySummary> rangeSearch(String startMonth, String endMonth) {
        List<MonthlySummary> result = new ArrayList<>();
        rangeSearchRecursive(root, startMonth, endMonth, result);
        return result;
    }

    private void rangeSearchRecursive(BSTNode current, String start, String end, List<MonthlySummary> result) {
        if (current == null) return;

        // If current.key is greater than start, left subtree might have keys in range
        if (start == null || current.key.compareTo(start) > 0) {
            rangeSearchRecursive(current.left, start, end, result);
        }

        // If current.key is in [start, end]
        boolean inRange = (start == null || current.key.compareTo(start) >= 0) &&
                          (end == null || current.key.compareTo(end) <= 0);
        if (inRange) {
            result.add(current.summary);
        }

        // If current.key is less than end, right subtree might have keys in range
        if (end == null || current.key.compareTo(end) < 0) {
            rangeSearchRecursive(current.right, start, end, result);
        }
    }

    public synchronized void rebuild(List<MaintenanceRecord> records) {
        clear();
        for (MaintenanceRecord r : records) {
            insert(r);
        }
    }

    public synchronized Map<String, Object> getTreeVisualization() {
        Map<String, Object> map = new HashMap<>();
        map.put("structure", "Binary Search Tree (BST)");
        map.put("nodeCount", nodeCount);
        map.put("inOrderSummaries", inOrderTraversal());
        map.put("treeHierarchy", buildTreeHierarchyDto(root));
        return map;
    }

    private Map<String, Object> buildTreeHierarchyDto(BSTNode node) {
        if (node == null) return null;
        Map<String, Object> dto = new HashMap<>();
        dto.put("key", node.key);
        dto.put("totalCollected", node.summary.getTotalCollected());
        dto.put("totalPending", node.summary.getTotalPending());
        dto.put("recordCount", node.summary.getTotalRecords());
        dto.put("left", buildTreeHierarchyDto(node.left));
        dto.put("right", buildTreeHierarchyDto(node.right));
        return dto;
    }
}
