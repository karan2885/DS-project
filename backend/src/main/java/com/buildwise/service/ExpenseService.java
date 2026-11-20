package com.buildwise.service;

import com.buildwise.datastructures.PaymentRecordManager;
import com.buildwise.model.Expense;
import com.buildwise.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final PaymentRecordManager paymentRecordManager;

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Optional<Expense> getById(String id) {
        return expenseRepository.findById(id);
    }

    public Expense createExpense(Expense expense) {
        if (expense.getExpenseId() == null || expense.getExpenseId().isEmpty()) {
            expense.setExpenseId("EXP-" + (1000 + (int)(Math.random() * 9000)));
        }
        if (expense.getExpenseDate() == null) {
            expense.setExpenseDate(LocalDate.now());
        }
        expense.setCreatedAt(LocalDateTime.now());

        Expense saved = expenseRepository.save(expense);

        // Synchronize in ArrayList
        paymentRecordManager.addExpenseRecord(saved);

        log.info("Recorded society expense: {} of ${}", saved.getCategory(), saved.getAmount());
        return saved;
    }

    public void deleteExpense(String id) {
        Expense existing = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found: " + id));
        expenseRepository.deleteById(id);
        paymentRecordManager.removeExpenseRecord(existing.getExpenseId());
    }

    public List<Expense> filterExpenses(String category) {
        return paymentRecordManager.filterExpensesByCategory(category);
    }

    public Map<String, Object> getFinancialOverview() {
        double totalIncome = paymentRecordManager.calculateTotalMaintenanceCollected();
        double totalExpenses = paymentRecordManager.calculateTotalExpenses();
        double pendingMaintenance = paymentRecordManager.calculateTotalPendingMaintenance();
        double netReserve = totalIncome - totalExpenses;

        Map<String, Object> overview = new HashMap<>();
        overview.put("totalIncome", totalIncome);
        overview.put("totalExpenses", totalExpenses);
        overview.put("pendingMaintenance", pendingMaintenance);
        overview.put("netReserve", netReserve);
        overview.put("expenseCount", paymentRecordManager.getAllExpenses().size());
        overview.put("paymentCount", paymentRecordManager.getAllPayments().size());
        return overview;
    }
}
