package com.buildwise.controller;

import com.buildwise.dto.UndoResponse;
import com.buildwise.model.Resident;
import com.buildwise.service.DataStructureService;
import com.buildwise.service.UndoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/datastructures")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DataStructureController {

    private final DataStructureService dataStructureService;
    private final UndoService undoService;

    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllStats() {
        return ResponseEntity.ok(dataStructureService.getAllOverviewStats());
    }

    /**
     * 1. ArrayList Monitor Endpoint
     */
    @GetMapping("/arraylist")
    public ResponseEntity<Map<String, Object>> getArrayListStats() {
        return ResponseEntity.ok(dataStructureService.getArrayListStats());
    }

    /**
     * 2. LinkedList Monitor Endpoint
     */
    @GetMapping("/linkedlist")
    public ResponseEntity<Map<String, Object>> getLinkedListStats() {
        return ResponseEntity.ok(dataStructureService.getLinkedListStats());
    }

    /**
     * 3. Stack Monitor Endpoint & Undo Trigger
     */
    @GetMapping("/stack")
    public ResponseEntity<Map<String, Object>> getStackStats() {
        return ResponseEntity.ok(dataStructureService.getStackStats());
    }

    @PostMapping("/stack/undo")
    public ResponseEntity<UndoResponse> undoLastOperation() {
        return ResponseEntity.ok(undoService.undoLastOperation());
    }

    /**
     * 4. Queue (FIFO) Monitor Endpoint
     */
    @GetMapping("/queue")
    public ResponseEntity<Map<String, Object>> getQueueStats() {
        return ResponseEntity.ok(dataStructureService.getQueueStats());
    }

    /**
     * 5. PriorityQueue Monitor Endpoint
     */
    @GetMapping("/priority-queue")
    public ResponseEntity<Map<String, Object>> getPriorityQueueStats() {
        return ResponseEntity.ok(dataStructureService.getPriorityQueueStats());
    }

    /**
     * 6. Binary Search Tree Monitor Endpoint
     */
    @GetMapping("/bst")
    public ResponseEntity<Map<String, Object>> getBstStats() {
        return ResponseEntity.ok(dataStructureService.getBstStats());
    }

    /**
     * 7. Graph Monitor Endpoint
     */
    @GetMapping("/graph")
    public ResponseEntity<Map<String, Object>> getGraphStats() {
        return ResponseEntity.ok(dataStructureService.getGraphStats());
    }

    /**
     * 8. AVL Tree Monitor Endpoint & Demonstrations
     */
    @GetMapping("/avl")
    public ResponseEntity<Map<String, Object>> getAvlStats() {
        return ResponseEntity.ok(dataStructureService.getAvlStats());
    }

    @GetMapping("/avl/search")
    public ResponseEntity<Map<String, Object>> searchAvl(@RequestParam String flat) {
        return ResponseEntity.ok(dataStructureService.searchAvl(flat));
    }

    @PostMapping("/avl/insert")
    public ResponseEntity<Map<String, Object>> insertAvlDemo(@RequestBody Resident resident) {
        return ResponseEntity.ok(dataStructureService.insertAvlDemo(resident));
    }

    @DeleteMapping("/avl/delete")
    public ResponseEntity<Map<String, Object>> deleteAvlDemo(@RequestParam String flat) {
        return ResponseEntity.ok(dataStructureService.deleteAvlDemo(flat));
    }
}
