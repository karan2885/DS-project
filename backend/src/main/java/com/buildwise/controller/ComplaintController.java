package com.buildwise.controller;

import com.buildwise.dto.*;
import com.buildwise.model.Complaint;
import com.buildwise.model.ComplaintActivity;
import com.buildwise.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getById(@PathVariable String id) {
        return complaintService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Submit Complaint via Entity Body
     */
    @PostMapping
    public ResponseEntity<Complaint> submitComplaint(@RequestBody Complaint complaint) {
        return ResponseEntity.ok(complaintService.submitComplaint(complaint));
    }

    /**
     * Submit Complaint via DTO
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerComplaint(@Valid @RequestBody ComplaintRegistrationDTO dto) {
        try {
            return ResponseEntity.ok(complaintService.registerComplaintFromDto(dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Assign Staff via query param
     */
    @PutMapping("/{id}/assign")
    public ResponseEntity<Complaint> assignStaff(
            @PathVariable String id,
            @RequestParam String staffName) {
        return ResponseEntity.ok(complaintService.assignStaff(id, staffName));
    }

    /**
     * Assign Staff via DTO
     */
    @PutMapping("/{id}/assign-dto")
    public ResponseEntity<?> assignStaffDto(
            @PathVariable String id,
            @Valid @RequestBody ComplaintAssignmentDTO dto) {
        try {
            return ResponseEntity.ok(complaintService.assignComplaintWithDto(id, dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Resolve Complaint Form Submission
     */
    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolveComplaint(
            @PathVariable String id,
            @Valid @RequestBody ComplaintResolutionDTO dto) {
        try {
            return ResponseEntity.ok(complaintService.resolveComplaint(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Close Complaint Form Submission (Mandatory Closure Reason)
     */
    @PutMapping("/{id}/close")
    public ResponseEntity<?> closeComplaint(
            @PathVariable String id,
            @Valid @RequestBody ComplaintClosureDTO dto) {
        try {
            return ResponseEntity.ok(complaintService.closeComplaint(id, dto));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Reopen Complaint Form Submission
     */
    @PutMapping("/{id}/reopen")
    public ResponseEntity<?> reopenComplaint(
            @PathVariable String id,
            @Valid @RequestBody ComplaintReopenDTO dto) {
        try {
            return ResponseEntity.ok(complaintService.reopenComplaint(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Complaint> updateStatus(
            @PathVariable String id,
            @RequestParam String status,
            @RequestParam(required = false) String remarks,
            @RequestParam(required = false) String performedBy) {
        return ResponseEntity.ok(complaintService.updateStatus(id, status, remarks, performedBy));
    }

    @PutMapping("/{id}/priority")
    public ResponseEntity<Complaint> updatePriority(
            @PathVariable String id,
            @RequestParam String priority) {
        return ResponseEntity.ok(complaintService.updatePriority(id, priority));
    }

    /**
     * Data Structure 4: FIFO Queue Assignment Action
     */
    @PostMapping("/assign-next-fifo")
    public ResponseEntity<?> assignNextFifo(@RequestParam(defaultValue = "Ramesh Verma (Senior Electrician)") String staff) {
        try {
            return ResponseEntity.ok(complaintService.assignNextFifo(staff));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Data Structure 5: Priority Queue Assignment Action
     */
    @PostMapping("/assign-next-priority")
    public ResponseEntity<?> assignNextPriority(@RequestParam(defaultValue = "Mukesh Solanki (Emergency Technician)") String staff) {
        try {
            return ResponseEntity.ok(complaintService.assignNextPriority(staff));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<ComplaintActivity>> getComplaintTimeline(@PathVariable String id) {
        return complaintService.getById(id)
                .map(c -> ResponseEntity.ok(c.getActivityHistory()))
                .orElse(ResponseEntity.notFound().build());
    }
}
