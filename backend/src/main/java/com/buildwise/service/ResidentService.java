package com.buildwise.service;

import com.buildwise.datastructures.PaymentRecordManager;
import com.buildwise.datastructures.ResidentAVLTree;
import com.buildwise.datastructures.ResidentActivityManager;
import com.buildwise.datastructures.UndoManager;
import com.buildwise.model.AdminOperation;
import com.buildwise.model.Resident;
import com.buildwise.model.ResidentActivity;
import com.buildwise.repository.AdminOperationRepository;
import com.buildwise.repository.ResidentActivityRepository;
import com.buildwise.repository.ResidentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResidentService {

    private final ResidentRepository residentRepository;
    private final ResidentActivityRepository residentActivityRepository;
    private final AdminOperationRepository adminOperationRepository;
    private final ResidentAVLTree residentAVLTree;
    private final ResidentActivityManager residentActivityManager;
    private final UndoManager undoManager;
    private final ObjectMapper objectMapper;

    public List<Resident> getAllResidents() {
        return residentRepository.findAll();
    }

    public List<Resident> getActiveResidents() {
        return residentRepository.findByActive(true);
    }

    public Optional<Resident> getResidentById(String id) {
        return residentRepository.findById(id);
    }

    public Optional<Resident> getResidentByFlat(String flatNumber) {
        // Fast retrieval via AVL Tree (O(log N))
        Resident avlFound = residentAVLTree.search(flatNumber);
        if (avlFound != null) {
            return Optional.of(avlFound);
        }
        return residentRepository.findByFlatNumber(flatNumber);
    }

    public Resident createResident(Resident resident) {
        if (resident.getResidentId() == null || resident.getResidentId().isEmpty()) {
            resident.setResidentId("RES-" + (1000 + (int)(Math.random() * 9000)));
        }
        resident.setActive(true);
        resident.setCreatedAt(LocalDateTime.now());
        resident.setUpdatedAt(LocalDateTime.now());

        Resident saved = residentRepository.save(resident);

        // Synchronize in-memory AVL Tree
        residentAVLTree.insert(saved);

        // Record activity in LinkedList & MongoDB
        recordActivity(saved, "REGISTRATION", "New resident " + saved.getName() + " registered in Flat " + saved.getFlatNumber());

        log.info("Created resident: {} in flat {}", saved.getName(), saved.getFlatNumber());
        return saved;
    }

    public Resident updateResident(String id, Resident details) {
        Resident existing = residentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resident not found with id: " + id));

        String oldStateJson = toJson(existing);

        existing.setName(details.getName());
        existing.setContactNumber(details.getContactNumber());
        existing.setEmail(details.getEmail());
        existing.setBuilding(details.getBuilding());
        existing.setOccupancyStatus(details.getOccupancyStatus());
        existing.setMoveInDate(details.getMoveInDate());
        existing.setUpdatedAt(LocalDateTime.now());

        Resident updated = residentRepository.save(existing);

        // Synchronize in AVL Tree
        residentAVLTree.insert(updated);

        // Push Undo Operation for status change
        recordUndoOperation("RESIDENT_STATUS_CHANGE", "Resident", updated.getId(),
                "Updated details / status for resident " + updated.getName() + " (" + updated.getFlatNumber() + ")",
                oldStateJson, toJson(updated));

        recordActivity(updated, "PROFILE_EDIT", "Updated profile/status to " + updated.getOccupancyStatus());
        return updated;
    }

    public void deleteResident(String id) {
        Resident existing = residentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resident not found with id: " + id));

        String oldStateJson = toJson(existing);

        // Soft delete / mark inactive
        existing.setActive(false);
        existing.setUpdatedAt(LocalDateTime.now());
        residentRepository.save(existing);

        // Remove from AVL Tree
        residentAVLTree.delete(existing.getFlatNumber());

        // Push to Undo Stack
        recordUndoOperation("RESIDENT_DELETE", "Resident", existing.getId(),
                "Deactivated resident " + existing.getName() + " from Flat " + existing.getFlatNumber(),
                oldStateJson, null);

        recordActivity(existing, "DEACTIVATION", "Resident deactivated from Flat " + existing.getFlatNumber());
        log.info("Deleted resident: {}", existing.getName());
    }

    public void restoreResident(Resident restored) {
        restored.setActive(true);
        restored.setUpdatedAt(LocalDateTime.now());
        Resident saved = residentRepository.save(restored);
        residentAVLTree.insert(saved);
        recordActivity(saved, "STATUS_UPDATE", "Restored resident " + saved.getName() + " to Flat " + saved.getFlatNumber() + " via Undo Action");
    }

    public List<Resident> searchResidents(String query, String building, String occupancyStatus) {
        List<Resident> all = residentRepository.findAll();
        return all.stream()
                .filter(r -> r.isActive())
                .filter(r -> {
                    if (query == null || query.isBlank()) return true;
                    String q = query.toLowerCase();
                    return (r.getName() != null && r.getName().toLowerCase().contains(q)) ||
                           (r.getFlatNumber() != null && r.getFlatNumber().toLowerCase().contains(q)) ||
                           (r.getResidentId() != null && r.getResidentId().toLowerCase().contains(q));
                })
                .filter(r -> {
                    if (building == null || building.isBlank() || "ALL".equalsIgnoreCase(building)) return true;
                    return building.equalsIgnoreCase(r.getBuilding());
                })
                .filter(r -> {
                    if (occupancyStatus == null || occupancyStatus.isBlank() || "ALL".equalsIgnoreCase(occupancyStatus)) return true;
                    return occupancyStatus.equalsIgnoreCase(r.getOccupancyStatus());
                })
                .collect(Collectors.toList());
    }

    private void recordActivity(Resident resident, String type, String desc) {
        ResidentActivity activity = ResidentActivity.builder()
                .activityId("ACT-" + UUID.randomUUID().toString().substring(0, 8))
                .residentId(resident.getResidentId())
                .residentName(resident.getName())
                .flatNumber(resident.getFlatNumber())
                .actionType(type)
                .description(desc)
                .performedBy("Admin")
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
            log.error("Error serializing to json", e);
            return "";
        }
    }
}
