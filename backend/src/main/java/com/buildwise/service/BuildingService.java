package com.buildwise.service;

import com.buildwise.datastructures.BuildingGraph;
import com.buildwise.model.BuildingNode;
import com.buildwise.repository.BuildingNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class BuildingService {

    private final BuildingNodeRepository buildingNodeRepository;
    private final BuildingGraph buildingGraph;

    public Map<String, Object> getGraphStructure() {
        return buildingGraph.getGraphVisualization();
    }

    public Map<String, Object> performBfs(String startNodeId) {
        return buildingGraph.bfs(startNodeId);
    }

    public Map<String, Object> performDfs(String startNodeId) {
        return buildingGraph.dfs(startNodeId);
    }

    public List<String> findPath(String fromId, String toId) {
        return buildingGraph.findShortestPath(fromId, toId);
    }

    public List<BuildingGraph.Vertex> getConnectedNodes(String nodeId) {
        return buildingGraph.getAdjacentVertices(nodeId);
    }

    public BuildingNode addNode(BuildingNode node) {
        BuildingNode saved = buildingNodeRepository.save(node);
        buildingGraph.addVertex(saved.getNodeId(), saved.getName(), saved.getType(), saved.getParentId(), saved.getDescription());
        if (saved.getParentId() != null && !saved.getParentId().isEmpty()) {
            buildingGraph.addEdge(saved.getParentId(), saved.getNodeId(), "CONTAINS", 1.0);
        }
        return saved;
    }

    public void removeNode(String nodeId) {
        buildingNodeRepository.deleteById(nodeId);
        buildingGraph.removeVertex(nodeId);
    }
}
