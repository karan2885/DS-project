package com.buildwise.datastructures;

import com.buildwise.model.AdminOperation;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Data Structure 3: Stack
 * Application: Reversible Administrative Operations (Undo History)
 * 
 * Demonstrates:
 * - LIFO (Last-In-First-Out) state management
 * - push(), pop(), and peek() operations
 * - Reversible entity state rollback across all modules
 */
@Component
public class UndoManager {

    // Main undo stack using Java Stack
    private final Stack<AdminOperation> operationStack = new Stack<>();

    // Full operation history log for audit and monitor display
    private final List<AdminOperation> auditLog = new ArrayList<>();

    public synchronized void pushOperation(AdminOperation operation) {
        operationStack.push(operation);
        auditLog.add(0, operation); // most recent first in audit log
    }

    public synchronized AdminOperation popOperation() {
        if (operationStack.isEmpty()) {
            return null;
        }
        return operationStack.pop();
    }

    public synchronized AdminOperation peekOperation() {
        if (operationStack.isEmpty()) {
            return null;
        }
        return operationStack.peek();
    }

    public synchronized boolean isEmpty() {
        return operationStack.isEmpty();
    }

    public synchronized int size() {
        return operationStack.size();
    }

    public synchronized List<AdminOperation> getStackAsList() {
        // Return stack elements from top to bottom
        List<AdminOperation> list = new ArrayList<>(operationStack);
        Collections.reverse(list);
        return list;
    }

    public synchronized List<AdminOperation> getAuditLog() {
        return new ArrayList<>(auditLog);
    }

    public synchronized void clear() {
        operationStack.clear();
        auditLog.clear();
    }

    public synchronized void initializeFromDb(List<AdminOperation> dbOperations) {
        operationStack.clear();
        auditLog.clear();
        // dbOperations are ordered timestamp desc; stack needs to be pushed in chronological order
        List<AdminOperation> chronological = new ArrayList<>(dbOperations);
        Collections.reverse(chronological);
        for (AdminOperation op : chronological) {
            if (!op.isUndone()) {
                operationStack.push(op);
            }
            auditLog.add(0, op);
        }
    }

    public synchronized Map<String, Object> getStackStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("structure", "Stack");
        stats.put("size", operationStack.size());
        stats.put("isEmpty", operationStack.isEmpty());
        stats.put("topElement", peekOperation());
        stats.put("stackElements", getStackAsList());
        return stats;
    }
}
