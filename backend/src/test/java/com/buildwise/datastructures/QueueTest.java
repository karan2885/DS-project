package com.buildwise.datastructures;

import com.buildwise.model.Complaint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Data Structure 4: Queue Tests - Regular FIFO Complaint Processing")
public class QueueTest {

    private ComplaintQueueManager queueManager;

    @BeforeEach
    void setUp() {
        queueManager = new ComplaintQueueManager();
    }

    @Test
    @DisplayName("Should verify FIFO processing and position tracking")
    void testFifoQueue() {
        Complaint c1 = Complaint.builder().complaintId("CMP-01").category("PLUMBING").status("SUBMITTED").submissionTime(LocalDateTime.now().minusMinutes(10)).build();
        Complaint c2 = Complaint.builder().complaintId("CMP-02").category("CLEANING").status("SUBMITTED").submissionTime(LocalDateTime.now().minusMinutes(5)).build();
        Complaint c3 = Complaint.builder().complaintId("CMP-03").category("PARKING").status("SUBMITTED").submissionTime(LocalDateTime.now()).build();

        queueManager.enqueue(c1);
        queueManager.enqueue(c2);
        queueManager.enqueue(c3);

        assertEquals(3, queueManager.size());

        // Check positions
        assertEquals(1, queueManager.getQueuePosition("CMP-01"));
        assertEquals(2, queueManager.getQueuePosition("CMP-02"));
        assertEquals(3, queueManager.getQueuePosition("CMP-03"));

        // Peek returns head without removing
        assertEquals("CMP-01", queueManager.peek().getComplaintId());

        // Dequeue removes head in FIFO order
        Complaint first = queueManager.dequeue();
        assertEquals("CMP-01", first.getComplaintId());
        assertEquals(2, queueManager.size());
        assertEquals(1, queueManager.getQueuePosition("CMP-02"));

        Complaint second = queueManager.dequeue();
        assertEquals("CMP-02", second.getComplaintId());

        Complaint third = queueManager.dequeue();
        assertEquals("CMP-03", third.getComplaintId());

        assertTrue(queueManager.isEmpty());
    }
}
