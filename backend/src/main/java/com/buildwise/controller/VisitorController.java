package com.buildwise.controller;

import com.buildwise.model.Visitor;
import com.buildwise.service.VisitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visitors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VisitorController {

    private final VisitorService visitorService;

    @GetMapping
    public ResponseEntity<List<Visitor>> getVisitors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(visitorService.filterVisitors(search, status));
    }

    @GetMapping("/active")
    public ResponseEntity<List<Visitor>> getActiveVisitors() {
        return ResponseEntity.ok(visitorService.getActiveVisitors());
    }

    @PostMapping
    public ResponseEntity<?> registerVisitor(@RequestBody Visitor visitor) {
        try {
            return ResponseEntity.ok(visitorService.registerVisitor(visitor));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/exit")
    public ResponseEntity<Visitor> checkoutVisitor(@PathVariable String id) {
        return ResponseEntity.ok(visitorService.checkoutVisitor(id));
    }

    @PutMapping("/{id}/allow")
    public ResponseEntity<?> allowVisitor(@PathVariable String id) {
        try {
            return ResponseEntity.ok(visitorService.allowVisitor(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset")
    public ResponseEntity<List<Visitor>> resetVisitors() {
        return ResponseEntity.ok(visitorService.resetVisitors());
    }
}
