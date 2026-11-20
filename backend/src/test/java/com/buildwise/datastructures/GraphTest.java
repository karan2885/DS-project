package com.buildwise.datastructures;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Data Structure 7: Graph Tests - Building Adjacency Network")
public class GraphTest {

    private BuildingGraph graph;

    @BeforeEach
    void setUp() {
        graph = new BuildingGraph();
    }

    @Test
    @DisplayName("Should create vertices, edges, and verify connectivity")
    void testVertexAndEdgeCreation() {
        graph.addVertex("BLDG-A", "Tower A", "BUILDING", null, "Tower A");
        graph.addVertex("FLR-1", "Floor 1", "FLOOR", "BLDG-A", "Level 1");
        graph.addVertex("A-101", "A-101", "FLAT", "FLR-1", "Flat 101");
        graph.addVertex("FAC-GYM", "Gym", "FACILITY", null, "Gym");

        graph.addEdge("BLDG-A", "FLR-1", "CONTAINS", 1.0);
        graph.addEdge("FLR-1", "A-101", "CONTAINS", 0.5);
        graph.addEdge("BLDG-A", "FAC-GYM", "ACCESS", 1.2);

        assertEquals(4, graph.getAllVertices().size());
        assertEquals(3, graph.getAllEdges().size());

        List<BuildingGraph.Vertex> neighborsOfA = graph.getAdjacentVertices("BLDG-A");
        assertEquals(2, neighborsOfA.size());
    }

    @Test
    @DisplayName("Should perform Breadth-First Search (BFS) and track levels")
    void testBfsTraversal() {
        graph.addVertex("A", "Node A", "BUILDING", null, "");
        graph.addVertex("B", "Node B", "FLOOR", null, "");
        graph.addVertex("C", "Node C", "FLOOR", null, "");
        graph.addVertex("D", "Node D", "FLAT", null, "");

        graph.addEdge("A", "B", "EDGE", 1.0);
        graph.addEdge("A", "C", "EDGE", 1.0);
        graph.addEdge("B", "D", "EDGE", 1.0);

        Map<String, Object> bfsResult = graph.bfs("A");
        List<?> order = (List<?>) bfsResult.get("visitedOrder");
        assertEquals(4, order.size());
        assertEquals("A", order.get(0));

        // BFS visits level 1 neighbors (B, C) before level 2 (D)
        int indexB = order.indexOf("B");
        int indexC = order.indexOf("C");
        int indexD = order.indexOf("D");

        assertTrue(indexB < indexD);
        assertTrue(indexC < indexD);
    }

    @Test
    @DisplayName("Should perform Depth-First Search (DFS)")
    void testDfsTraversal() {
        graph.addVertex("A", "Node A", "BUILDING", null, "");
        graph.addVertex("B", "Node B", "FLOOR", null, "");
        graph.addVertex("C", "Node C", "FLAT", null, "");

        graph.addEdge("A", "B", "EDGE", 1.0);
        graph.addEdge("B", "C", "EDGE", 1.0);

        Map<String, Object> dfsResult = graph.dfs("A");
        List<?> order = (List<?>) dfsResult.get("visitedOrder");
        assertEquals(3, order.size());
        assertEquals("A", order.get(0));
        assertEquals("B", order.get(1));
        assertEquals("C", order.get(2));
    }

    @Test
    @DisplayName("Should find shortest path between two nodes")
    void testShortestPath() {
        graph.addVertex("GATE", "Gate", "FACILITY", null, "");
        graph.addVertex("BLDG-A", "Tower A", "BUILDING", null, "");
        graph.addVertex("FLR-1", "Floor 1", "FLOOR", null, "");
        graph.addVertex("A-101", "Flat A-101", "FLAT", null, "");

        graph.addEdge("GATE", "BLDG-A", "ROAD", 1.0);
        graph.addEdge("BLDG-A", "FLR-1", "LIFT", 1.0);
        graph.addEdge("FLR-1", "A-101", "DOOR", 0.5);

        List<String> path = graph.findShortestPath("GATE", "A-101");
        assertEquals(4, path.size());
        assertEquals(List.of("GATE", "BLDG-A", "FLR-1", "A-101"), path);
    }
}
