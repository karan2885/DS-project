package com.buildwise.datastructures;

import com.buildwise.model.Complaint;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Data Structure 5: PriorityQueue
 * Application: Emergency and Priority-Based Complaint Assignment
 * 
 * Demonstrates:
 * - Binary Min-Heap Priority Queue with custom Comparator
 * - Priority ranks: CRITICAL (1) > HIGH (2) > MEDIUM (3) > LOW (4)
 * - Secondary tie-breaking by submission timestamp (FIFO within same priority)
 * - Safe priority mutation (remove + update rank + re-offer)
 */
@Component
public class ComplaintPriorityManager {

    private static int getPriorityRank(String priority) {
        if (priority == null) return 4;
        return switch (priority.toUpperCase()) {
            case "CRITICAL" -> 1;
            case "HIGH" -> 2;
            case "MEDIUM" -> 3;
            case "LOW" -> 4;
            default -> 5;
        };
    }

    // Custom comparator: Primary = Priority Rank ascending (1 first); Secondary = Submission Time ascending
    public static final Comparator<Complaint> PRIORITY_COMPARATOR = (c1, c2) -> {
        int r1 = getPriorityRank(c1.getPriority());
        int r2 = getPriorityRank(c2.getPriority());
        if (r1 != r2) {
            return Integer.compare(r1, r2);
        }
        if (c1.getSubmissionTime() != null && c2.getSubmissionTime() != null) {
            return c1.getSubmissionTime().compareTo(c2.getSubmissionTime());
        }
        return 0;
    };

    private final PriorityQueue<Complaint> priorityQueue = new PriorityQueue<>(PRIORITY_COMPARATOR);

    public synchronized void addComplaint(Complaint complaint) {
        if (!contains(complaint.getComplaintId())) {
            priorityQueue.offer(complaint);
        }
    }

    public synchronized Complaint pollHighestPriority() {
        return priorityQueue.poll();
    }

    public synchronized Complaint peekHighestPriority() {
        return priorityQueue.peek();
    }

    public synchronized boolean isEmpty() {
        return priorityQueue.isEmpty();
    }

    public synchronized int size() {
        return priorityQueue.size();
    }

    public synchronized boolean contains(String complaintId) {
        for (Complaint c : priorityQueue) {
            if (c.getComplaintId().equals(complaintId)) {
                return true;
            }
        }
        return false;
    }

    public synchronized boolean removeComplaint(String complaintId) {
        Complaint toRemove = null;
        for (Complaint c : priorityQueue) {
            if (c.getComplaintId().equals(complaintId)) {
                toRemove = c;
                break;
            }
        }
        if (toRemove != null) {
            return priorityQueue.remove(toRemove);
        }
        return false;
    }

    /**
     * Safely updates complaint priority by removing and re-inserting into the PriorityQueue
     */
    public synchronized void updatePriority(String complaintId, String newPriority) {
        Complaint target = null;
        for (Complaint c : priorityQueue) {
            if (c.getComplaintId().equals(complaintId)) {
                target = c;
                break;
            }
        }
        if (target != null) {
            priorityQueue.remove(target);
            target.setPriority(newPriority);
            priorityQueue.offer(target);
        }
    }

    public synchronized List<Complaint> getOrderedList() {
        // Return a copy sorted in true priority order
        List<Complaint> list = new ArrayList<>(priorityQueue);
        list.sort(PRIORITY_COMPARATOR);
        return list;
    }

    public synchronized void initializePriorityQueue(List<Complaint> complaints) {
        priorityQueue.clear();
        for (Complaint c : complaints) {
            if ("SUBMITTED".equalsIgnoreCase(c.getStatus()) || "ASSIGNED".equalsIgnoreCase(c.getStatus())) {
                priorityQueue.offer(c);
            }
        }
    }

    public synchronized Map<String, Object> getPriorityQueueStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("structure", "PriorityQueue (Min-Heap with Custom Comparator)");
        stats.put("size", priorityQueue.size());
        stats.put("isEmpty", priorityQueue.isEmpty());
        stats.put("highestPriorityComplaint", peekHighestPriority());
        stats.put("priorityRankingOrder", getOrderedList());
        return stats;
    }
}
