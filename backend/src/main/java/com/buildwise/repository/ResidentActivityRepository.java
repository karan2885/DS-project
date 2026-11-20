package com.buildwise.repository;

import com.buildwise.model.ResidentActivity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResidentActivityRepository extends MongoRepository<ResidentActivity, String> {
    List<ResidentActivity> findByResidentIdOrderByTimestampDesc(String residentId);
    List<ResidentActivity> findAllByOrderByTimestampDesc();
}
