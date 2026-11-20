package com.buildwise.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "building_nodes")
public class BuildingNode {
    @Id
    private String id;
    private String nodeId;         // e.g. "BLDG-A", "FLR-A1", "FLAT-A101", "FAC-GYM"
    private String name;           // "Tower A", "Floor 1", "A-101", "Fitness Gymnasium"
    private String type;           // BUILDING, FLOOR, FLAT, FACILITY
    private String parentId;       // Parent node ID
    @Builder.Default
    private List<String> connectedTo = new ArrayList<>(); // Connected node IDs
    private String description;
}
