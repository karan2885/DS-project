package com.buildwise.service;

import com.buildwise.datastructures.*;
import com.buildwise.model.Resident;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DataStructureService {

    private final PaymentRecordManager paymentRecordManager;
    private final ResidentActivityManager residentActivityManager;
    private final UndoManager undoManager;
    private final ComplaintQueueManager complaintQueueManager;
    private final ComplaintPriorityManager complaintPriorityManager;
    private final MaintenanceBST maintenanceBST;
    private final BuildingGraph buildingGraph;
    private final ResidentAVLTree residentAVLTree;

    public Map<String, Object> getAllOverviewStats() {
        Map<String, Object> allStats = new HashMap<>();
        allStats.put("arrayList", paymentRecordManager.getArrayListStats());
        allStats.put("linkedList", residentActivityManager.getLinkedListStats());
        allStats.put("stack", undoManager.getStackStats());
        allStats.put("queue", complaintQueueManager.getQueueStats());
        allStats.put("priorityQueue", complaintPriorityManager.getPriorityQueueStats());
        allStats.put("bst", maintenanceBST.getTreeVisualization());
        allStats.put("graph", buildingGraph.getGraphVisualization());
        allStats.put("avl", residentAVLTree.getTreeVisualization());
        return allStats;
    }

    public Map<String, Object> getArrayListStats() {
        return paymentRecordManager.getArrayListStats();
    }

    public Map<String, Object> getLinkedListStats() {
        return residentActivityManager.getLinkedListStats();
    }

    public Map<String, Object> getStackStats() {
        return undoManager.getStackStats();
    }

    public Map<String, Object> getQueueStats() {
        return complaintQueueManager.getQueueStats();
    }

    public Map<String, Object> getPriorityQueueStats() {
        return complaintPriorityManager.getPriorityQueueStats();
    }

    public Map<String, Object> getBstStats() {
        return maintenanceBST.getTreeVisualization();
    }

    public Map<String, Object> getGraphStats() {
        return buildingGraph.getGraphVisualization();
    }

    public Map<String, Object> getAvlStats() {
        return residentAVLTree.getTreeVisualization();
    }

    public Map<String, Object> searchAvl(String flatNumber) {
        return residentAVLTree.searchWithTrace(flatNumber);
    }

    public Map<String, Object> insertAvlDemo(Resident resident) {
        residentAVLTree.insert(resident);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("lastRotation", residentAVLTree.getLastRotationType());
        res.put("totalRotations", residentAVLTree.getTotalRotations());
        res.put("tree", residentAVLTree.getTreeVisualization());
        return res;
    }

    public Map<String, Object> deleteAvlDemo(String flatNumber) {
        residentAVLTree.delete(flatNumber);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("lastRotation", residentAVLTree.getLastRotationType());
        res.put("totalRotations", residentAVLTree.getTotalRotations());
        res.put("tree", residentAVLTree.getTreeVisualization());
        return res;
    }
}
