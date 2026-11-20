package com.buildwise.repository;

import com.buildwise.model.SocietyConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SocietyConfigRepository extends MongoRepository<SocietyConfig, String> {
    Optional<SocietyConfig> findFirstByOrderByIdAsc();
}
