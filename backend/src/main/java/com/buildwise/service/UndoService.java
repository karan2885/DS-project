package com.buildwise.service;

import com.buildwise.datastructures.UndoManager;
import com.buildwise.dto.UndoResponse;
import com.buildwise.model.*;
import com.buildwise.repository.AdminOperationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class UndoService {

    private final UndoManager undoManager;
    private final AdminOperationRepository adminOperationRepository;
    private final ResidentService residentService;
    private final MaintenanceService maintenanceService;
    private final NoticeService noticeService;
    private final ComplaintService complaintService;
    private final ObjectMapper objectMapper;

    public UndoService(UndoManager undoManager,
                       AdminOperationRepository adminOperationRepository,
                       @Lazy ResidentService residentService,
                       @Lazy MaintenanceService maintenanceService,
                       @Lazy NoticeService noticeService,
                       @Lazy ComplaintService complaintService,
                       ObjectMapper objectMapper) {
        this.undoManager = undoManager;
        this.adminOperationRepository = adminOperationRepository;
        this.residentService = residentService;
        this.maintenanceService = maintenanceService;
        this.noticeService = noticeService;
        this.complaintService = complaintService;
        this.objectMapper = objectMapper;
    }

    public UndoResponse undoLastOperation() {
        if (undoManager.isEmpty()) {
            return UndoResponse.builder()
                    .success(false)
                    .message("Undo stack is empty. No operations to undo.")
                    .remainingUndoStackSize(0)
                    .build();
        }

        AdminOperation op = undoManager.popOperation();
        if (op == null) {
            return UndoResponse.builder()
                    .success(false)
                    .message("No operation found on stack.")
                    .remainingUndoStackSize(0)
                    .build();
        }

        try {
            switch (op.getOperationType()) {
                case "RESIDENT_DELETE":
                case "RESIDENT_STATUS_CHANGE": {
                    Resident prevResident = objectMapper.readValue(op.getPreviousStateJson(), Resident.class);
                    residentService.restoreResident(prevResident);
                    break;
                }
                case "MAINTENANCE_STATUS_UPDATE": {
                    MaintenanceRecord prevRecord = objectMapper.readValue(op.getPreviousStateJson(), MaintenanceRecord.class);
                    maintenanceService.restoreRecord(prevRecord);
                    break;
                }
                case "NOTICE_DELETE": {
                    Notice prevNotice = objectMapper.readValue(op.getPreviousStateJson(), Notice.class);
                    noticeService.restoreNotice(prevNotice);
                    break;
                }
                case "COMPLAINT_STATUS_CHANGE": {
                    Complaint prevComplaint = objectMapper.readValue(op.getPreviousStateJson(), Complaint.class);
                    complaintService.restoreComplaint(prevComplaint);
                    break;
                }
                default:
                    log.warn("Unknown undo operation type: {}", op.getOperationType());
            }

            // Mark as undone in persistent database
            op.setUndone(true);
            adminOperationRepository.save(op);

            return UndoResponse.builder()
                    .success(true)
                    .message("Successfully rolled back: " + op.getDescription())
                    .operationType(op.getOperationType())
                    .entityType(op.getEntityType())
                    .entityId(op.getEntityId())
                    .remainingUndoStackSize(undoManager.size())
                    .build();

        } catch (Exception e) {
            log.error("Failed to undo operation: " + op.getOperationId(), e);
            // Re-push operation if undo failed
            undoManager.pushOperation(op);
            return UndoResponse.builder()
                    .success(false)
                    .message("Failed to undo operation: " + e.getMessage())
                    .remainingUndoStackSize(undoManager.size())
                    .build();
        }
    }
}
