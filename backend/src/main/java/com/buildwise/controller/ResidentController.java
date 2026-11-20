package com.buildwise.controller;

import com.buildwise.model.Resident;
import com.buildwise.service.ResidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/residents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResidentController {

    private final ResidentService residentService;

    @GetMapping
    public ResponseEntity<List<Resident>> getResidents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) String occupancyStatus) {
        return ResponseEntity.ok(residentService.searchResidents(search, building, occupancyStatus));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resident> getResidentById(@PathVariable String id) {
        return residentService.getResidentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/flat/{flatNumber}")
    public ResponseEntity<Resident> getResidentByFlat(@PathVariable String flatNumber) {
        return residentService.getResidentByFlat(flatNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Resident> createResident(@RequestBody Resident resident) {
        return ResponseEntity.ok(residentService.createResident(resident));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resident> updateResident(@PathVariable String id, @RequestBody Resident resident) {
        return ResponseEntity.ok(residentService.updateResident(id, resident));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResident(@PathVariable String id) {
        residentService.deleteResident(id);
        return ResponseEntity.noContent().build();
    }
}
