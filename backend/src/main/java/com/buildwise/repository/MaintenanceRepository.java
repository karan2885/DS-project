package com.buildwise.repository;

import com.buildwise.model.MaintenanceRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceRepository extends MongoRepository<MaintenanceRecord, String> {
    Optional<MaintenanceRecord> findByRecordId(String recordId);
    List<MaintenanceRecord> findByMonthYear(String monthYear);
    List<MaintenanceRecord> findByResidentId(String residentId);
    List<MaintenanceRecord> findByFlatNumber(String flatNumber);
    List<MaintenanceRecord> findByPaymentStatus(String paymentStatus);
    List<MaintenanceRecord> findByBuilding(String building);
}
