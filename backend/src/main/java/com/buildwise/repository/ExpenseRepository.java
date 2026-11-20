package com.buildwise.repository;

import com.buildwise.model.Expense;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends MongoRepository<Expense, String> {
    Optional<Expense> findByExpenseId(String expenseId);
    List<Expense> findByCategory(String category);
}
