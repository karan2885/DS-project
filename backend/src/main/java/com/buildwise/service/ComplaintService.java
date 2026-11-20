package com.buildwise.service;

import com.buildwise.datastructures.ComplaintPriorityManager;
import com.buildwise.datastructures.ComplaintQueueManager;
import com.buildwise.datastructures.ResidentActivityManager;
import com.buildwise.datastructures.UndoManager;
import com.buildwise.dto.*;
import com.buildwise.model.AdminOperation;
import com.buildwise.model.Complaint;
import com.buildwise.model.ComplaintActivity;
import com.buildwise.model.ResidentActivity;
import com.buildwise.repository.AdminOperationRepository;
import com.buildwise.repository.ComplaintRepository;
import com.buildwise.repository.ResidentActivityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ResidentActivityRepository residentActivityRepository;
    private final AdminOperationRepository adminOperationRepository;
    private final ComplaintQueueManager complaintQueueManager;
    private final ComplaintPriorityManager complaintPriorityManager;
    private final ResidentActivityManager residentActivityManager;
    private final UndoManager undoManager;
    private final ObjectMapper objectMapper;

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public Optional<Complaint> getById(String id) {
        return complaintRepository.findById(id);
    }

    /**
     * Submit complaint via entity or DTO
     */
    public Complaint submitComplaint(Complaint complaint) {
        if (complaint.getComplaintId() == null || complaint.getComplaintId().isEmpty()) {
            complaint.setComplaintId("CMP-" + (1000 + (int)(Math.random() * 9000)));
        }
        if (complaint.getStatus() == null) {
            complaint.setStatus("SUBMITTED");
        }
        if (complaint.getPriority() == null) {
            complaint.setPriority("MEDIUM");
        }
        if (complaint.getTitle() == null || complaint.getTitle().isBlank()) {
            complaint.setTitle(complaint.getCategory() + " Issue at Flat " + complaint.getFlatNumber());
        }
        complaint.setSubmissionTime(LocalDateTime.now());

        // Initial complaint activity record in chronological LinkedList
        ComplaintActivity initActivity = ComplaintActivity.builder()
                .activityId("ACT-C-" + UUID.randomUUID().toString().substring(0, 6))
                .complaintId(complaint.getComplaintId())
                .action("Complaint Submitted")
                .performedBy(complaint.getResidentName() != null ? complaint.getResidentName() : "Resident")
                .timestamp(LocalDateTime.now())
                .remarks("Initial submission: " + (complaint.getDescription() != null ? complaint.getDescription() : complaint.getTitle()))
                .build();

        if (complaint.getActivityHistory() == null) {
            complaint.setActivityHistory(new ArrayList<>());
        }
        complaint.getActivityHistory().add(initActivity);

        Complaint saved = complaintRepository.save(complaint);

        // Synchronize in Complaint LinkedList timeline
        residentActivityManager.addComplaintActivity(saved.getComplaintId(), initActivity);

        // Synchronize FIFO Queue (Data Structure 4)
        complaintQueueManager.enqueue(saved);

        // Synchronize PriorityQueue (Data Structure 5)
        complaintPriorityManager.addComplaint(saved);

        // Record in Resident Activity LinkedList (Data Structure 2)
        recordResidentActivity(saved, "COMPLAINT_LOGGED", "Lodged complaint: " + saved.getTitle() + " at Flat " + saved.getFlatNumber());

        log.info("Registered complaint {} in Queue and PriorityQueue", saved.getComplaintId());
        return saved;
    }

    public Complaint registerComplaintFromDto(ComplaintRegistrationDTO dto) {
        Complaint complaint = Complaint.builder()
                .residentName(dto.getResidentName())
                .flatNumber(dto.getFlatNumber())
                .building(dto.getBuilding() != null ? dto.getBuilding() : deriveBuildingFromFlat(dto.getFlatNumber()))
                .category(dto.getCategory().toUpperCase())
                .priority(dto.getPriority() != null ? dto.getPriority().toUpperCase() : "MEDIUM")
                .title(dto.getTitle())
                .description(dto.getDescription())
                .attachmentUrl(dto.getAttachmentUrl())
                .status("SUBMITTED")
                .build();
        return submitComplaint(complaint);
    }

    /**
     * Assign staff to complaint
     */
    public Complaint assignStaff(String id, String staffName) {
        ComplaintAssignmentDTO dto = ComplaintAssignmentDTO.builder()
                .staffName(staffName)
                .staffContact("+91 98251 10022")
                .remarks("Assigned to maintenance technician: " + staffName)
                .assignedBy("Admin")
                .build();
        return assignComplaintWithDto(id, dto);
    }

    public Complaint assignComplaintWithDto(String id, ComplaintAssignmentDTO dto) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));

        String oldJson = toJson(complaint);

        complaint.setStatus("ASSIGNED");
        complaint.setAssignedStaff(dto.getStaffName());
        complaint.setStaffContact(dto.getStaffContact());
        complaint.setAssignedDate(LocalDateTime.now());

        String remarks = (dto.getRemarks() != null && !dto.getRemarks().isBlank()) 
                ? dto.getRemarks() 
                : "Assigned to staff " + dto.getStaffName();

        ComplaintActivity activity = ComplaintActivity.builder()
                .activityId("ACT-C-" + UUID.randomUUID().toString().substring(0, 6))
                .complaintId(complaint.getComplaintId())
                .action("Assigned to Staff")
                .performedBy(dto.getAssignedBy() != null ? dto.getAssignedBy() : "Admin")
                .timestamp(LocalDateTime.now())
                .remarks(remarks)
                .build();

        complaint.getActivityHistory().add(activity);
        Complaint saved = complaintRepository.save(complaint);

        // Update in data structures
        residentActivityManager.addComplaintActivity(saved.getComplaintId(), activity);
        complaintQueueManager.remove(saved.getComplaintId()); // Removed from pending FIFO queue
        complaintPriorityManager.removeComplaint(saved.getComplaintId()); // Removed from pending PriorityQueue

        recordUndoOperation("COMPLAINT_STATUS_CHANGE", "Complaint", saved.getId(),
                "Assigned complaint " + saved.getComplaintId() + " to " + dto.getStaffName(),
                oldJson, toJson(saved));

        return saved;
    }

    /**
     * Resolve complaint with mandatory resolution description and work performed
     */
    public Complaint resolveComplaint(String id, ComplaintResolutionDTO dto) {
        if (dto.getResolutionDescription() == null || dto.getResolutionDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Resolution description is mandatory to resolve a complaint!");
        }
        if (dto.getWorkPerformed() == null || dto.getWorkPerformed().trim().isEmpty()) {
            throw new IllegalArgumentException("Work performed details are mandatory to resolve a complaint!");
        }

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));

        String oldJson = toJson(complaint);

        complaint.setStatus("RESOLVED");
        complaint.setResolutionDescription(dto.getResolutionDescription().trim());
        complaint.setWorkPerformed(dto.getWorkPerformed().trim());
        complaint.setResolvedBy(dto.getResolvedBy() != null ? dto.getResolvedBy() : "Admin");
        complaint.setResolvedTime(LocalDateTime.now());
        if (dto.getAttachmentUrl() != null && !dto.getAttachmentUrl().isBlank()) {
            complaint.setAttachmentUrl(dto.getAttachmentUrl());
        }

        // Remove from queues if still present
        complaintQueueManager.remove(complaint.getComplaintId());
        complaintPriorityManager.removeComplaint(complaint.getComplaintId());

        String remarks = "Resolution: " + dto.getResolutionDescription().trim() + " | Work: " + dto.getWorkPerformed().trim();
        ComplaintActivity activity = ComplaintActivity.builder()
                .activityId("ACT-C-" + UUID.randomUUID().toString().substring(0, 6))
                .complaintId(complaint.getComplaintId())
                .action("Complaint Resolved")
                .performedBy(complaint.getResolvedBy())
                .timestamp(LocalDateTime.now())
                .remarks(remarks)
                .build();

        complaint.getActivityHistory().add(activity);
        Complaint saved = complaintRepository.save(complaint);

        residentActivityManager.addComplaintActivity(saved.getComplaintId(), activity);

        recordUndoOperation("COMPLAINT_STATUS_CHANGE", "Complaint", saved.getId(),
                "Resolved complaint " + saved.getComplaintId(),
                oldJson, toJson(saved));

        recordResidentActivity(saved, "COMPLAINT_RESOLVED", "Complaint " + saved.getComplaintId() + " marked RESOLVED");

        return saved;
    }

    /**
     * Close complaint with MANDATORY closure reason validation
     */
    public Complaint closeComplaint(String id, ComplaintClosureDTO dto) {
        if (dto.getClosureReason() == null || dto.getClosureReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Closure reason is strictly mandatory! A complaint cannot be closed without a valid reason.");
        }

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));

        // Business Rule Validation: Complaint must be in RESOLVED status before closing,
        // unless explicitly categorized as duplicate or withdrawn
        boolean isAdministrativeBypass = "DUPLICATE_MERGED".equalsIgnoreCase(dto.getClosureCategory()) ||
                                         "WITHDRAWN_BY_RESIDENT".equalsIgnoreCase(dto.getClosureCategory());

        if (!"RESOLVED".equalsIgnoreCase(complaint.getStatus()) && !isAdministrativeBypass) {
            throw new IllegalStateException("A complaint must be marked as RESOLVED before closing. " +
                    "Alternatively, select an administrative closure reason (Duplicate or Withdrawn).");
        }

        String oldJson = toJson(complaint);

        complaint.setStatus("CLOSED");
        complaint.setClosureReason(dto.getClosureReason().trim());
        complaint.setClosedBy(dto.getClosedBy() != null ? dto.getClosedBy() : "Admin");
        complaint.setClosureTime(LocalDateTime.now());

        // Ensure removed from queues
        complaintQueueManager.remove(complaint.getComplaintId());
        complaintPriorityManager.removeComplaint(complaint.getComplaintId());

        ComplaintActivity activity = ComplaintActivity.builder()
                .activityId("ACT-C-" + UUID.randomUUID().toString().substring(0, 6))
                .complaintId(complaint.getComplaintId())
                .action("Complaint Closed")
                .performedBy(complaint.getClosedBy())
                .timestamp(LocalDateTime.now())
                .remarks("Closure Reason: " + dto.getClosureReason().trim())
                .build();

        complaint.getActivityHistory().add(activity);
        Complaint saved = complaintRepository.save(complaint);

        residentActivityManager.addComplaintActivity(saved.getComplaintId(), activity);

        recordUndoOperation("COMPLAINT_STATUS_CHANGE", "Complaint", saved.getId(),
                "Closed complaint " + saved.getComplaintId() + " (" + dto.getClosureReason().trim() + ")",
                oldJson, toJson(saved));

        recordResidentActivity(saved, "COMPLAINT_CLOSED", "Complaint " + saved.getComplaintId() + " CLOSED by " + complaint.getClosedBy());

        return saved;
    }

    /**
     * Reopen complaint when resident reports issue persists
     */
    public Complaint reopenComplaint(String id, ComplaintReopenDTO dto) {
        if (dto.getReopenedReason() == null || dto.getReopenedReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Reopening reason is strictly mandatory!");
        }

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));

        String oldJson = toJson(complaint);

        complaint.setStatus("REOPENED");
        complaint.setReopenedReason(dto.getReopenedReason().trim());
        complaint.setReopenedBy(dto.getReopenedBy() != null ? dto.getReopenedBy() : "Resident / Admin");
        complaint.setReopenedTime(LocalDateTime.now());
        if (dto.getUpdatedPriority() != null && !dto.getUpdatedPriority().isBlank()) {
            complaint.setPriority(dto.getUpdatedPriority().toUpperCase());
        }

        ComplaintActivity activity = ComplaintActivity.builder()
                .activityId("ACT-C-" + UUID.randomUUID().toString().substring(0, 6))
                .complaintId(complaint.getComplaintId())
                .action("Complaint Reopened")
                .performedBy(complaint.getReopenedBy())
                .timestamp(LocalDateTime.now())
                .remarks("Reopened Reason: " + dto.getReopenedReason().trim())
                .build();

        complaint.getActivityHistory().add(activity);
        Complaint saved = complaintRepository.save(complaint);

        // Re-enqueue into FIFO Queue and PriorityQueue
        complaintQueueManager.enqueue(saved);
        complaintPriorityManager.addComplaint(saved);

        residentActivityManager.addComplaintActivity(saved.getComplaintId(), activity);

        recordUndoOperation("COMPLAINT_STATUS_CHANGE", "Complaint", saved.getId(),
                "Reopened complaint " + saved.getComplaintId(),
                oldJson, toJson(saved));

        recordResidentActivity(saved, "COMPLAINT_REOPENED", "Complaint " + saved.getComplaintId() + " REOPENED: " + dto.getReopenedReason().trim());

        return saved;
    }

    public Complaint updateStatus(String id, String newStatus, String remarks, String performedBy) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));

        String oldJson = toJson(complaint);

        String upper = newStatus.toUpperCase();
        complaint.setStatus(upper);

        if ("RESOLVED".equalsIgnoreCase(upper)) {
            complaint.setResolvedTime(LocalDateTime.now());
            complaint.setResolvedBy(performedBy != null ? performedBy : "Admin");
            complaintQueueManager.remove(complaint.getComplaintId());
            complaintPriorityManager.removeComplaint(complaint.getComplaintId());
        } else if ("CLOSED".equalsIgnoreCase(upper)) {
            complaint.setClosureTime(LocalDateTime.now());
            complaint.setClosedBy(performedBy != null ? performedBy : "Admin");
            if (remarks != null && !remarks.isBlank()) {
                complaint.setClosureReason(remarks);
            }
            complaintQueueManager.remove(complaint.getComplaintId());
            complaintPriorityManager.removeComplaint(complaint.getComplaintId());
        }

        ComplaintActivity activity = ComplaintActivity.builder()
                .activityId("ACT-C-" + UUID.randomUUID().toString().substring(0, 6))
                .complaintId(complaint.getComplaintId())
                .action("Status Changed to " + upper)
                .performedBy(performedBy != null ? performedBy : "Admin")
                .timestamp(LocalDateTime.now())
                .remarks(remarks != null ? remarks : "Status updated to " + upper)
                .build();

        complaint.getActivityHistory().add(activity);
        Complaint saved = complaintRepository.save(complaint);

        residentActivityManager.addComplaintActivity(saved.getComplaintId(), activity);

        recordUndoOperation("COMPLAINT_STATUS_CHANGE", "Complaint", saved.getId(),
                "Changed status of complaint " + saved.getComplaintId() + " to " + upper,
                oldJson, toJson(saved));

        return saved;
    }

    public Complaint updatePriority(String id, String newPriority) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));

        String oldJson = toJson(complaint);
        complaint.setPriority(newPriority.toUpperCase());

        ComplaintActivity activity = ComplaintActivity.builder()
                .activityId("ACT-C-" + UUID.randomUUID().toString().substring(0, 6))
                .complaintId(complaint.getComplaintId())
                .action("Priority Escalated/Changed")
                .performedBy("Admin")
                .timestamp(LocalDateTime.now())
                .remarks("Priority updated to " + newPriority)
                .build();

        complaint.getActivityHistory().add(activity);
        Complaint saved = complaintRepository.save(complaint);

        // Priority modification in PriorityQueue: remove and re-insert safely
        complaintPriorityManager.updatePriority(saved.getComplaintId(), newPriority);

        recordUndoOperation("COMPLAINT_STATUS_CHANGE", "Complaint", saved.getId(),
                "Updated priority of complaint " + saved.getComplaintId() + " to " + newPriority,
                oldJson, toJson(saved));

        return saved;
    }

    public Complaint assignNextFifo(String staffName) {
        Complaint nextInQueue = complaintQueueManager.peek();
        if (nextInQueue == null) {
            throw new RuntimeException("No complaints waiting in the FIFO Queue!");
        }
        return assignStaff(nextInQueue.getId(), staffName);
    }

    public Complaint assignNextPriority(String staffName) {
        Complaint highestPriority = complaintPriorityManager.peekHighestPriority();
        if (highestPriority == null) {
            throw new RuntimeException("No complaints waiting in the Priority Queue!");
        }
        return assignStaff(highestPriority.getId(), staffName);
    }

    public void restoreComplaint(Complaint restored) {
        complaintRepository.save(restored);
        if ("SUBMITTED".equalsIgnoreCase(restored.getStatus()) || "REOPENED".equalsIgnoreCase(restored.getStatus())) {
            complaintQueueManager.enqueue(restored);
            complaintPriorityManager.addComplaint(restored);
        }
    }

    private String deriveBuildingFromFlat(String flat) {
        if (flat == null || flat.length() < 2) return "A Wing";
        char prefix = Character.toUpperCase(flat.charAt(0));
        return prefix + " Wing";
    }

    private void recordResidentActivity(Complaint complaint, String type, String desc) {
        ResidentActivity activity = ResidentActivity.builder()
                .activityId("ACT-" + UUID.randomUUID().toString().substring(0, 8))
                .residentId(complaint.getResidentId())
                .residentName(complaint.getResidentName())
                .flatNumber(complaint.getFlatNumber())
                .actionType(type)
                .description(desc)
                .performedBy(complaint.getResidentName() != null ? complaint.getResidentName() : "Resident")
                .timestamp(LocalDateTime.now())
                .build();
        residentActivityRepository.save(activity);
        residentActivityManager.addActivity(activity);
    }

    private void recordUndoOperation(String opType, String entityType, String entityId, String desc, String prevJson, String updatedJson) {
        AdminOperation op = AdminOperation.builder()
                .operationId("OP-" + UUID.randomUUID().toString().substring(0, 8))
                .operationType(opType)
                .entityType(entityType)
                .entityId(entityId)
                .description(desc)
                .previousStateJson(prevJson)
                .updatedStateJson(updatedJson)
                .timestamp(LocalDateTime.now())
                .undone(false)
                .build();
        adminOperationRepository.save(op);
        undoManager.pushOperation(op);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "";
        }
    }
}
