package com.buildwise.datastructures;

import com.buildwise.model.ComplaintActivity;
import com.buildwise.model.ResidentActivity;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Data Structure 2: LinkedList
 * Application: Resident Activity Timeline and Chronological Complaint History
 * 
 * Demonstrates:
 * - Sequential and bidirectional node traversal
 * - O(1) insertion at head/tail
 * - Chronological history tracking
 */
@Component
public class ResidentActivityManager {

    // Main activity timeline stored in a Java LinkedList
    private final LinkedList<ResidentActivity> activityList = new LinkedList<>();

    // Map storing complaint-specific history timelines as LinkedLists
    private final Map<String, LinkedList<ComplaintActivity>> complaintHistories = new HashMap<>();

    public synchronized void addActivity(ResidentActivity activity) {
        // Add to front (head) so newest is always readily accessible in O(1)
        activityList.addFirst(activity);
    }

    public synchronized void setActivities(List<ResidentActivity> activities) {
        activityList.clear();
        // Add preserving descending chronological order
        for (ResidentActivity act : activities) {
            activityList.addLast(act);
        }
    }

    public synchronized List<ResidentActivity> getAllActivities() {
        return new ArrayList<>(activityList);
    }

    public synchronized List<ResidentActivity> getRecentActivities(int count) {
        return activityList.stream().limit(count).collect(Collectors.toList());
    }

    public synchronized List<ResidentActivity> getActivitiesForResident(String residentId) {
        List<ResidentActivity> filtered = new ArrayList<>();
        // Sequential traversal demonstration
        for (ResidentActivity act : activityList) {
            if (residentId != null && residentId.equalsIgnoreCase(act.getResidentId())) {
                filtered.add(act);
            }
        }
        return filtered;
    }

    public synchronized void addComplaintActivity(String complaintId, ComplaintActivity activity) {
        complaintHistories.computeIfAbsent(complaintId, k -> new LinkedList<>()).addLast(activity);
    }

    public synchronized void setComplaintActivities(String complaintId, List<ComplaintActivity> activities) {
        LinkedList<ComplaintActivity> list = new LinkedList<>(activities);
        complaintHistories.put(complaintId, list);
    }

    public synchronized LinkedList<ComplaintActivity> getComplaintTimeline(String complaintId) {
        LinkedList<ComplaintActivity> list = complaintHistories.get(complaintId);
        return list != null ? new LinkedList<>(list) : new LinkedList<>();
    }

    public synchronized Map<String, Object> getLinkedListStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("structure", "LinkedList");
        stats.put("totalActivityNodes", activityList.size());
        stats.put("totalComplaintsTracked", complaintHistories.size());

        if (!activityList.isEmpty()) {
            stats.put("headActivity", activityList.getFirst());
            stats.put("tailActivity", activityList.getLast());
        } else {
            stats.put("headActivity", null);
            stats.put("tailActivity", null);
        }

        // Sequential traversal sample
        List<Map<String, Object>> traversalSample = new ArrayList<>();
        int index = 0;
        for (ResidentActivity act : activityList) {
            if (index >= 6) break;
            Map<String, Object> node = new HashMap<>();
            node.put("index", index);
            node.put("activityId", act.getActivityId());
            node.put("actionType", act.getActionType());
            node.put("residentName", act.getResidentName());
            node.put("timestamp", act.getTimestamp());
            node.put("description", act.getDescription());
            traversalSample.add(node);
            index++;
        }
        stats.put("traversalSample", traversalSample);
        return stats;
    }
}
