package com.buildwise.datastructures;

import com.buildwise.model.Complaint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Data Structure 5: PriorityQueue Tests - Complaint Prioritization")
public class PriorityQueueTest {

    private ComplaintPriorityManager priorityManager;

    @BeforeEach
    void setUp() {
        priorityManager = new ComplaintPriorityManager();
    }

    @Test
    @DisplayName("Should extract complaints ordered by Critical > High > Medium > Low")
    void testPriorityRanking() {
        LocalDateTime now = LocalDateTime.now();
        Complaint low = Complaint.builder().complaintId("C-LOW").priority("LOW").submissionTime(now.minusHours(5)).build();
        Complaint medium = Complaint.builder().complaintId("C-MED").priority("MEDIUM").submissionTime(now.minusHours(4)).build();
        Complaint high = Complaint.builder().complaintId("C-HIGH").priority("HIGH").submissionTime(now.minusHours(3)).build();
        Complaint critical = Complaint.builder().complaintId("C-CRIT").priority("CRITICAL").submissionTime(now.minusHours(1)).build();

        // Add in mixed order
        priorityManager.addComplaint(medium);
        priorityManager.addComplaint(low);
        priorityManager.addComplaint(critical);
        priorityManager.addComplaint(high);

        assertEquals(4, priorityManager.size());

        // Polling should yield: CRITICAL -> HIGH -> MEDIUM -> LOW
        assertEquals("C-CRIT", priorityManager.pollHighestPriority().getComplaintId());
        assertEquals("C-HIGH", priorityManager.pollHighestPriority().getComplaintId());
        assertEquals("C-MED", priorityManager.pollHighestPriority().getComplaintId());
        assertEquals("C-LOW", priorityManager.pollHighestPriority().getComplaintId());
    }

    @Test
    @DisplayName("Should break ties using submission timestamp (earlier first)")
    void testTimestampTieBreaker() {
        LocalDateTime t1 = LocalDateTime.of(2026, 3, 1, 10, 0);
        LocalDateTime t2 = LocalDateTime.of(2026, 3, 1, 11, 0);

        Complaint highEarlier = Complaint.builder().complaintId("H-1").priority("HIGH").submissionTime(t1).build();
        Complaint highLater = Complaint.builder().complaintId("H-2").priority("HIGH").submissionTime(t2).build();

        priorityManager.addComplaint(highLater);
        priorityManager.addComplaint(highEarlier);

        assertEquals("H-1", priorityManager.pollHighestPriority().getComplaintId());
        assertEquals("H-2", priorityManager.pollHighestPriority().getComplaintId());
    }

    @Test
    @DisplayName("Should safely mutate priority with remove and re-offer")
    void testSafePriorityMutation() {
        LocalDateTime now = LocalDateTime.now();
        Complaint c1 = Complaint.builder().complaintId("C-1").priority("LOW").submissionTime(now).build();
        Complaint c2 = Complaint.builder().complaintId("C-2").priority("MEDIUM").submissionTime(now).build();

        priorityManager.addComplaint(c1);
        priorityManager.addComplaint(c2);

        // Before update, C-2 (MEDIUM) has higher priority
        assertEquals("C-2", priorityManager.peekHighestPriority().getComplaintId());

        // Escalate C-1 from LOW to CRITICAL
        priorityManager.updatePriority("C-1", "CRITICAL");

        // Now C-1 (CRITICAL) should be at top
        assertEquals("C-1", priorityManager.peekHighestPriority().getComplaintId());
    }
}
