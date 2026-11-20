package com.buildwise.repository;

import com.buildwise.model.Resident;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResidentRepository extends MongoRepository<Resident, String> {
    Optional<Resident> findByResidentId(String residentId);
    Optional<Resident> findByFlatNumber(String flatNumber);
    List<Resident> findByBuilding(String building);
    List<Resident> findByOccupancyStatus(String occupancyStatus);
    List<Resident> findByActive(boolean active);
    boolean existsByFlatNumberAndActive(String flatNumber, boolean active);
}
