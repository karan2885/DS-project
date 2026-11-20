package com.buildwise.repository;

import com.buildwise.model.Complaint;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends MongoRepository<Complaint, String> {
    Optional<Complaint> findByComplaintId(String complaintId);
    List<Complaint> findByStatus(String status);
    List<Complaint> findByPriority(String priority);
    List<Complaint> findByCategory(String category);
    List<Complaint> findByFlatNumber(String flatNumber);
}
