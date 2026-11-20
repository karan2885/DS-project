package com.buildwise.datastructures;

import com.buildwise.model.Complaint;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Data Structure 4: Queue (FIFO)
 * Application: Regular Complaint Processing Pipeline
 * 
 * Demonstrates:
 * - First-In-First-Out (FIFO) processing order
 * - Enqueue (offer/add) and Dequeue (poll/remove)
 * - Waiting position tracking and next candidate inspection (peek)
 */
@Component
public class ComplaintQueueManager {

    // Main FIFO queue using ArrayDeque
    private final Queue<Complaint> complaintQueue = new ArrayDeque<>();

    public synchronized void enqueue(Complaint complaint) {
        // Only enqueue if not already in queue
        if (!contains(complaint.getComplaintId())) {
            complaintQueue.offer(complaint);
        }
    }

    public synchronized Complaint dequeue() {
        return complaintQueue.poll();
    }

    public synchronized Complaint peek() {
        return complaintQueue.peek();
    }

    public synchronized boolean isEmpty() {
        return complaintQueue.isEmpty();
    }

    public synchronized int size() {
        return complaintQueue.size();
    }

    public synchronized boolean contains(String complaintId) {
        for (Complaint c : complaintQueue) {
            if (c.getComplaintId().equals(complaintId)) {
                return true;
            }
        }
        return false;
    }

    public synchronized boolean remove(String complaintId) {
        return complaintQueue.removeIf(c -> c.getComplaintId().equals(complaintId));
    }

    public synchronized void updateComplaint(Complaint updated) {
        // If present in queue, update in place
        List<Complaint> temp = new ArrayList<>(complaintQueue);
        complaintQueue.clear();
        for (Complaint c : temp) {
            if (c.getComplaintId().equals(updated.getComplaintId())) {
                complaintQueue.offer(updated);
            } else {
                complaintQueue.offer(c);
            }
        }
    }

    public synchronized int getQueuePosition(String complaintId) {
        int position = 1;
        for (Complaint c : complaintQueue) {
            if (c.getComplaintId().equals(complaintId)) {
                return position;
            }
            position++;
        }
        return -1; // Not in queue
    }

    public synchronized List<Map<String, Object>> getQueueWithPositions() {
        List<Map<String, Object>> list = new ArrayList<>();
        int pos = 1;
        for (Complaint c : complaintQueue) {
            Map<String, Object> item = new HashMap<>();
            item.put("position", pos++);
            item.put("complaint", c);
            list.add(item);
        }
        return list;
    }

    public synchronized void initializeQueue(List<Complaint> complaints) {
        complaintQueue.clear();
        // Sort by submissionTime ascending to ensure strict FIFO submission order
        List<Complaint> sorted = new ArrayList<>(complaints);
        sorted.sort(Comparator.comparing(Complaint::getSubmissionTime));
        for (Complaint c : sorted) {
            if ("SUBMITTED".equalsIgnoreCase(c.getStatus())) {
                complaintQueue.offer(c);
            }
        }
    }

    public synchronized Map<String, Object> getQueueStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("structure", "Queue (FIFO - ArrayDeque)");
        stats.put("size", complaintQueue.size());
        stats.put("isEmpty", complaintQueue.isEmpty());
        stats.put("nextComplaint", peek());
        stats.put("queueItems", getQueueWithPositions());
        return stats;
    }
}
