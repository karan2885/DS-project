package com.buildwise.datastructures;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Data Structure 7: Graph (Adjacency List)
 * Application: Building, Floor, Flat, and Facility Topological Connectivity
 * 
 * Demonstrates:
 * - Adjacency List vertex & directed/undirected edge mapping
 * - Breadth-First Search (BFS) for level-order proximity and shortest path
 * - Depth-First Search (DFS) for branch exploration
 * - Building hierarchy connectivity analysis
 */
@Component
public class BuildingGraph {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Vertex {
        private String id;
        private String label;
        private String type;         // BUILDING, FLOOR, FLAT, FACILITY
        private String parentId;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Edge {
        private String source;
        private String target;
        private String relationship; // HAS_FLOOR, HAS_FLAT, AMENITY_ACCESS, CORRIDOR
        private double weight;
    }

    private final Map<String, Vertex> vertices = new HashMap<>();
    private final Map<String, List<Edge>> adjacencyList = new HashMap<>();

    public synchronized void addVertex(String id, String label, String type, String parentId, String description) {
        Vertex v = Vertex.builder()
                .id(id)
                .label(label)
                .type(type)
                .parentId(parentId)
                .description(description)
                .build();
        vertices.put(id, v);
        adjacencyList.putIfAbsent(id, new ArrayList<>());
    }

    public synchronized void addEdge(String fromId, String toId, String relationship, double weight) {
        if (!vertices.containsKey(fromId) || !vertices.containsKey(toId)) {
            return;
        }
        Edge edge1 = Edge.builder()
                .source(fromId)
                .target(toId)
                .relationship(relationship)
                .weight(weight)
                .build();
        adjacencyList.computeIfAbsent(fromId, k -> new ArrayList<>()).add(edge1);

        // Undirected graph for physical walkability / spatial adjacency
        Edge edge2 = Edge.builder()
                .source(toId)
                .target(fromId)
                .relationship(relationship)
                .weight(weight)
                .build();
        adjacencyList.computeIfAbsent(toId, k -> new ArrayList<>()).add(edge2);
    }

    public synchronized void removeVertex(String id) {
        vertices.remove(id);
        adjacencyList.remove(id);
        for (List<Edge> edges : adjacencyList.values()) {
            edges.removeIf(e -> e.getTarget().equals(id));
        }
    }

    public synchronized void removeEdge(String fromId, String toId) {
        if (adjacencyList.containsKey(fromId)) {
            adjacencyList.get(fromId).removeIf(e -> e.getTarget().equals(toId));
        }
        if (adjacencyList.containsKey(toId)) {
            adjacencyList.get(toId).removeIf(e -> e.getTarget().equals(fromId));
        }
    }

    public synchronized Vertex getVertex(String id) {
        return vertices.get(id);
    }

    public synchronized List<Vertex> getAllVertices() {
        return new ArrayList<>(vertices.values());
    }

    public synchronized List<Edge> getAllEdges() {
        Set<String> visited = new HashSet<>();
        List<Edge> edges = new ArrayList<>();
        for (List<Edge> list : adjacencyList.values()) {
            for (Edge e : list) {
                String pair = e.getSource().compareTo(e.getTarget()) < 0 
                        ? e.getSource() + "-" + e.getTarget() 
                        : e.getTarget() + "-" + e.getSource();
                if (!visited.contains(pair)) {
                    visited.add(pair);
                    edges.add(e);
                }
            }
        }
        return edges;
    }

    public synchronized List<Vertex> getAdjacentVertices(String id) {
        List<Vertex> neighbors = new ArrayList<>();
        List<Edge> edges = adjacencyList.get(id);
        if (edges != null) {
            for (Edge e : edges) {
                Vertex v = vertices.get(e.getTarget());
                if (v != null) {
                    neighbors.add(v);
                }
            }
        }
        return neighbors;
    }

    /**
     * Breadth-First Search (BFS)
     * Explores building network level-by-level
     */
    public synchronized Map<String, Object> bfs(String startId) {
        List<String> visitedOrder = new ArrayList<>();
        Map<String, Integer> distanceLevels = new HashMap<>();

        if (!vertices.containsKey(startId)) {
            startId = vertices.keySet().iterator().hasNext() ? vertices.keySet().iterator().next() : null;
        }
        if (startId == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("visitedOrder", visitedOrder);
            res.put("levels", distanceLevels);
            return res;
        }

        Queue<String> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();

        queue.offer(startId);
        visited.add(startId);
        distanceLevels.put(startId, 0);

        while (!queue.isEmpty()) {
            String current = queue.poll();
            visitedOrder.add(current);
            int currentLevel = distanceLevels.get(current);

            List<Edge> edges = adjacencyList.getOrDefault(current, Collections.emptyList());
            for (Edge edge : edges) {
                String neighbor = edge.getTarget();
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    distanceLevels.put(neighbor, currentLevel + 1);
                    queue.offer(neighbor);
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("startVertex", startId);
        result.put("visitedCount", visitedOrder.size());
        result.put("visitedOrder", visitedOrder);
        result.put("distanceLevels", distanceLevels);
        return result;
    }

    /**
     * Depth-First Search (DFS)
     * Explores branches deeply first
     */
    public synchronized Map<String, Object> dfs(String startId) {
        List<String> visitedOrder = new ArrayList<>();
        if (!vertices.containsKey(startId)) {
            startId = vertices.keySet().iterator().hasNext() ? vertices.keySet().iterator().next() : null;
        }
        if (startId == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("visitedOrder", visitedOrder);
            return res;
        }

        Set<String> visited = new HashSet<>();
        dfsRecursive(startId, visited, visitedOrder);

        Map<String, Object> result = new HashMap<>();
        result.put("startVertex", startId);
        result.put("visitedCount", visitedOrder.size());
        result.put("visitedOrder", visitedOrder);
        return result;
    }

    private void dfsRecursive(String current, Set<String> visited, List<String> visitedOrder) {
        visited.add(current);
        visitedOrder.add(current);

        List<Edge> edges = adjacencyList.getOrDefault(current, Collections.emptyList());
        for (Edge edge : edges) {
            String neighbor = edge.getTarget();
            if (!visited.contains(neighbor)) {
                dfsRecursive(neighbor, visited, visitedOrder);
            }
        }
    }

    /**
     * Find shortest path between two vertices using BFS
     */
    public synchronized List<String> findShortestPath(String fromId, String toId) {
        if (!vertices.containsKey(fromId) || !vertices.containsKey(toId)) {
            return Collections.emptyList();
        }
        if (fromId.equals(toId)) {
            return List.of(fromId);
        }

        Queue<String> queue = new LinkedList<>();
        Map<String, String> parentMap = new HashMap<>();
        Set<String> visited = new HashSet<>();

        queue.offer(fromId);
        visited.add(fromId);

        boolean found = false;
        while (!queue.isEmpty()) {
            String current = queue.poll();
            if (current.equals(toId)) {
                found = true;
                break;
            }

            for (Edge edge : adjacencyList.getOrDefault(current, Collections.emptyList())) {
                String neighbor = edge.getTarget();
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    parentMap.put(neighbor, current);
                    queue.offer(neighbor);
                }
            }
        }

        if (!found) return Collections.emptyList();

        LinkedList<String> path = new LinkedList<>();
        String curr = toId;
        while (curr != null) {
            path.addFirst(curr);
            curr = parentMap.get(curr);
        }
        return path;
    }

    public synchronized Map<String, Object> getGraphVisualization() {
        Map<String, Object> graph = new HashMap<>();
        graph.put("structure", "Graph (Adjacency List)");
        graph.put("vertexCount", vertices.size());
        graph.put("edgeCount", getAllEdges().size());
        graph.put("nodes", vertices.values());
        graph.put("links", getAllEdges());
        return graph;
    }

    public synchronized void clear() {
        vertices.clear();
        adjacencyList.clear();
    }
}
