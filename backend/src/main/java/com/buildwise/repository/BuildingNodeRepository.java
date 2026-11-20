package com.buildwise.repository;

import com.buildwise.model.BuildingNode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BuildingNodeRepository extends MongoRepository<BuildingNode, String> {
    Optional<BuildingNode> findByNodeId(String nodeId);
    List<BuildingNode> findByType(String type);
    List<BuildingNode> findByParentId(String parentId);
}
