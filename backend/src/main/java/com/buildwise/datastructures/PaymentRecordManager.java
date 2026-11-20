package com.buildwise.datastructures;

import com.buildwise.model.Expense;
import com.buildwise.model.MaintenanceRecord;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

/**
 * Data Structure 1: ArrayList
 * Application: Maintenance Collections and Society Expenses
 * 
 * Demonstrates:
 * - Dynamic array operations (add, get, remove, iterate)
 * - Filtering and financial aggregation over in-memory collections
 * - Monthly financial summaries calculation
 */
@Component
public class PaymentRecordManager {

    // Primary collections using Java ArrayList
    private final List<MaintenanceRecord> paymentRecords = new CopyOnWriteArrayList<>();
    private final List<Expense> expenseRecords = new CopyOnWriteArrayList<>();

    public synchronized void addPaymentRecord(MaintenanceRecord record) {
        paymentRecords.add(record);
    }

    public synchronized void setPaymentRecords(List<MaintenanceRecord> records) {
        paymentRecords.clear();
        paymentRecords.addAll(records);
    }

    public synchronized void updatePaymentRecord(MaintenanceRecord updated) {
        for (int i = 0; i < paymentRecords.size(); i++) {
            if (paymentRecords.get(i).getRecordId().equals(updated.getRecordId())) {
                paymentRecords.set(i, updated);
                return;
            }
        }
        paymentRecords.add(updated);
    }

    public synchronized void removePaymentRecord(String recordId) {
        paymentRecords.removeIf(r -> r.getRecordId().equals(recordId));
    }

    public synchronized void addExpenseRecord(Expense expense) {
        expenseRecords.add(expense);
    }

    public synchronized void setExpenseRecords(List<Expense> records) {
        expenseRecords.clear();
        expenseRecords.addAll(records);
    }

    public synchronized void removeExpenseRecord(String expenseId) {
        expenseRecords.removeIf(e -> e.getExpenseId().equals(expenseId));
    }

    public List<MaintenanceRecord> getAllPayments() {
        return new ArrayList<>(paymentRecords);
    }

    public List<Expense> getAllExpenses() {
        return new ArrayList<>(expenseRecords);
    }

    public double calculateTotalMaintenanceCollected() {
        double total = 0.0;
        for (MaintenanceRecord r : paymentRecords) {
            if ("PAID".equalsIgnoreCase(r.getPaymentStatus())) {
                total += r.getTotalAmount();
            }
        }
        return total;
    }

    public double calculateTotalPendingMaintenance() {
        double total = 0.0;
        for (MaintenanceRecord r : paymentRecords) {
            if ("UNPAID".equalsIgnoreCase(r.getPaymentStatus()) || "OVERDUE".equalsIgnoreCase(r.getPaymentStatus())) {
                total += r.getTotalAmount();
            }
        }
        return total;
    }

    public double calculateTotalExpenses() {
        double total = 0.0;
        for (Expense e : expenseRecords) {
            total += e.getAmount();
        }
        return total;
    }

    public List<MaintenanceRecord> filterPaymentsByMonth(String monthYear) {
        List<MaintenanceRecord> result = new ArrayList<>();
        for (MaintenanceRecord r : paymentRecords) {
            if (monthYear == null || monthYear.isEmpty() || monthYear.equalsIgnoreCase(r.getMonthYear())) {
                result.add(r);
            }
        }
        return result;
    }

    public List<Expense> filterExpensesByCategory(String category) {
        List<Expense> result = new ArrayList<>();
        for (Expense e : expenseRecords) {
            if (category == null || category.isEmpty() || category.equalsIgnoreCase(e.getCategory())) {
                result.add(e);
            }
        }
        return result;
    }

    public Map<String, Object> generateMonthlyFinancialReport(String monthYear) {
        List<MaintenanceRecord> monthlyPayments = filterPaymentsByMonth(monthYear);
        double collected = 0.0;
        double pending = 0.0;
        int paidCount = 0;
        int pendingCount = 0;

        for (MaintenanceRecord r : monthlyPayments) {
            if ("PAID".equalsIgnoreCase(r.getPaymentStatus())) {
                collected += r.getTotalAmount();
                paidCount++;
            } else {
                pending += r.getTotalAmount();
                pendingCount++;
            }
        }

        double monthlyExpenses = 0.0;
        for (Expense e : expenseRecords) {
            if (e.getExpenseDate() != null && e.getExpenseDate().toString().startsWith(monthYear)) {
                monthlyExpenses += e.getAmount();
            }
        }

        Map<String, Object> report = new HashMap<>();
        report.put("monthYear", monthYear);
        report.put("collectedAmount", collected);
        report.put("pendingAmount", pending);
        report.put("paidCount", paidCount);
        report.put("pendingCount", pendingCount);
        report.put("totalExpenseAmount", monthlyExpenses);
        report.put("netBalance", collected - monthlyExpenses);
        report.put("totalRecordsInMonth", monthlyPayments.size());
        return report;
    }

    public Map<String, Object> getArrayListStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("structure", "ArrayList");
        stats.put("paymentRecordsCount", paymentRecords.size());
        stats.put("expenseRecordsCount", expenseRecords.size());
        stats.put("totalCollected", calculateTotalMaintenanceCollected());
        stats.put("totalPending", calculateTotalPendingMaintenance());
        stats.put("totalExpenses", calculateTotalExpenses());
        stats.put("samplePayments", paymentRecords.stream().limit(5).collect(Collectors.toList()));
        stats.put("sampleExpenses", expenseRecords.stream().limit(5).collect(Collectors.toList()));
        return stats;
    }
}
