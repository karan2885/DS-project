package com.buildwise.datastructures;

import com.buildwise.model.AdminOperation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Data Structure 3: Stack Tests - Administrative Undo Stack")
public class StackTest {

    private UndoManager undoManager;

    @BeforeEach
    void setUp() {
        undoManager = new UndoManager();
    }

    @Test
    @DisplayName("Should verify LIFO behavior for push, peek, and pop")
    void testLifoBehavior() {
        AdminOperation op1 = AdminOperation.builder().operationId("OP-1").operationType("RESIDENT_STATUS_CHANGE").timestamp(LocalDateTime.now().minusMinutes(5)).build();
        AdminOperation op2 = AdminOperation.builder().operationId("OP-2").operationType("MAINTENANCE_STATUS_UPDATE").timestamp(LocalDateTime.now().minusMinutes(2)).build();

        undoManager.pushOperation(op1);
        undoManager.pushOperation(op2);

        assertEquals(2, undoManager.size());
        assertFalse(undoManager.isEmpty());

        // Peek does not remove
        assertEquals("OP-2", undoManager.peekOperation().getOperationId());
        assertEquals(2, undoManager.size());

        // Pop removes in LIFO order
        AdminOperation popped = undoManager.popOperation();
        assertEquals("OP-2", popped.getOperationId());
        assertEquals(1, undoManager.size());

        AdminOperation popped2 = undoManager.popOperation();
        assertEquals("OP-1", popped2.getOperationId());
        assertTrue(undoManager.isEmpty());
    }

    @Test
    @DisplayName("Should handle empty stack gracefully")
    void testEmptyStack() {
        assertTrue(undoManager.isEmpty());
        assertNull(undoManager.peekOperation());
        assertNull(undoManager.popOperation());
    }
}
