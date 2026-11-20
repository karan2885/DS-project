package com.buildwise.service;

import com.buildwise.model.Visitor;
import com.buildwise.repository.VisitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisitorService {

    private final VisitorRepository visitorRepository;

    public List<Visitor> getAllVisitors() {
        return visitorRepository.findAll();
    }

    public List<Visitor> getActiveVisitors() {
        return visitorRepository.findByStatus("ACTIVE");
    }

    public Optional<Visitor> getById(String id) {
        return visitorRepository.findById(id);
    }

    public Visitor registerVisitor(Visitor visitor) {
        // Application-level validation: Prevent duplicate active visitor entries
        if (visitor.getPhone() != null && !visitor.getPhone().isBlank()) {
            boolean alreadyActive = visitorRepository.existsByPhoneAndStatus(visitor.getPhone().trim(), "ACTIVE");
            if (alreadyActive) {
                throw new IllegalArgumentException("A visitor with phone " + visitor.getPhone() + " is already currently inside the society (Active Status)!");
            }
        }

        if (visitor.getVisitorId() == null || visitor.getVisitorId().isEmpty()) {
            visitor.setVisitorId("VIS-" + (1000 + (int)(Math.random() * 9000)));
        }
        visitor.setStatus("ACTIVE");
        visitor.setEntryTime(LocalDateTime.now());
        visitor.setCreatedAt(LocalDateTime.now());

        Visitor saved = visitorRepository.save(visitor);
        log.info("Registered visitor: {} visiting {}", saved.getName(), saved.getVisitingFlat());
        return saved;
    }

    public Visitor checkoutVisitor(String id) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor not found: " + id));

        visitor.setStatus("CHECKED_OUT");
        visitor.setExitTime(LocalDateTime.now());
        return visitorRepository.save(visitor);
    }

    public Visitor allowVisitor(String id) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor not found: " + id));

        // Application-level validation: Prevent duplicate active visitor entries
        if (visitor.getPhone() != null && !visitor.getPhone().isBlank()) {
            boolean alreadyActive = visitorRepository.existsByPhoneAndStatus(visitor.getPhone().trim(), "ACTIVE");
            if (alreadyActive) {
                throw new IllegalArgumentException("A visitor with phone " + visitor.getPhone() + " is already currently inside the society (Active Status)!");
            }
        }

        visitor.setStatus("ACTIVE");
        visitor.setEntryTime(LocalDateTime.now());
        visitor.setExitTime(null);
        Visitor saved = visitorRepository.save(visitor);
        log.info("Allowed visitor entry: {} visiting {}", saved.getName(), saved.getVisitingFlat());
        return saved;
    }

    public List<Visitor> resetVisitors() {
        List<Visitor> visitors = visitorRepository.findAll();
        for (Visitor v : visitors) {
            v.setStatus("PENDING");
            v.setEntryTime(null);
            v.setExitTime(null);
        }
        List<Visitor> saved = visitorRepository.saveAll(visitors);
        log.info("Reset {} visitor records to PENDING entry approval status", saved.size());
        return saved;
    }

    public List<Visitor> filterVisitors(String query, String status) {
        return visitorRepository.findAll().stream()
                .filter(v -> {
                    if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) return true;
                    return status.equalsIgnoreCase(v.getStatus());
                })
                .filter(v -> {
                    if (query == null || query.isBlank()) return true;
                    String q = query.toLowerCase();
                    return (v.getName() != null && v.getName().toLowerCase().contains(q)) ||
                           (v.getPhone() != null && v.getPhone().contains(q)) ||
                           (v.getVisitingFlat() != null && v.getVisitingFlat().toLowerCase().contains(q));
                })
                .collect(Collectors.toList());
    }
}
