package com.buildwise.repository;

import com.buildwise.model.AdminOperation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminOperationRepository extends MongoRepository<AdminOperation, String> {
    Optional<AdminOperation> findByOperationId(String operationId);
    List<AdminOperation> findByUndoneOrderByTimestampDesc(boolean undone);
    List<AdminOperation> findAllByOrderByTimestampDesc();
}
