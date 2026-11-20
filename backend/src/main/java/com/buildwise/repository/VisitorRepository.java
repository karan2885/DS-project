package com.buildwise.repository;

import com.buildwise.model.Visitor;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VisitorRepository extends MongoRepository<Visitor, String> {
    Optional<Visitor> findByVisitorId(String visitorId);
    List<Visitor> findByStatus(String status);
    List<Visitor> findByVisitingFlat(String visitingFlat);
    boolean existsByPhoneAndStatus(String phone, String status);
}
