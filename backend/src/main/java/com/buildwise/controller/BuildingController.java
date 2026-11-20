package com.buildwise.controller;

import com.buildwise.datastructures.BuildingGraph;
import com.buildwise.model.BuildingNode;
import com.buildwise.service.BuildingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/building")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BuildingController {

    private final BuildingService buildingService;

    @GetMapping("/graph")
    public ResponseEntity<Map<String, Object>> getGraph() {
        return ResponseEntity.ok(buildingService.getGraphStructure());
    }

    @GetMapping("/bfs")
    public ResponseEntity<Map<String, Object>> performBfs(@RequestParam(defaultValue = "BLDG-A") String startNode) {
        return ResponseEntity.ok(buildingService.performBfs(startNode));
    }

    @GetMapping("/dfs")
    public ResponseEntity<Map<String, Object>> performDfs(@RequestParam(defaultValue = "BLDG-A") String startNode) {
        return ResponseEntity.ok(buildingService.performDfs(startNode));
    }

    @GetMapping("/path")
    public ResponseEntity<List<String>> findPath(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(buildingService.findPath(from, to));
    }

    @GetMapping("/connected/{nodeId}")
    public ResponseEntity<List<BuildingGraph.Vertex>> getConnectedNodes(@PathVariable String nodeId) {
        return ResponseEntity.ok(buildingService.getConnectedNodes(nodeId));
    }

    @PostMapping("/node")
    public ResponseEntity<BuildingNode> addNode(@RequestBody BuildingNode node) {
        return ResponseEntity.ok(buildingService.addNode(node));
    }

    @DeleteMapping("/node/{nodeId}")
    public ResponseEntity<Void> removeNode(@PathVariable String nodeId) {
        buildingService.removeNode(nodeId);
        return ResponseEntity.noContent().build();
    }
}
