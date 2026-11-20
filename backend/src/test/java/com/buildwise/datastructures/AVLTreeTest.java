package com.buildwise.datastructures;

import com.buildwise.model.Resident;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Data Structure 8: AVL Tree Tests - Balanced Resident Indexing & Rotations")
public class AVLTreeTest {

    private ResidentAVLTree avl;

    @BeforeEach
    void setUp() {
        avl = new ResidentAVLTree();
    }

    private Resident createResident(String flat, String name) {
        return Resident.builder()
                .residentId("R-" + flat)
                .flatNumber(flat)
                .name(name)
                .building("Tower A")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Should trigger RR Rotation (Left Rotate) on right-heavy insertion")
    void testRRRotation() {
        // Inserting ascending keys triggers RR rotation
        avl.insert(createResident("A-101", "Resident 1"));
        avl.insert(createResident("A-102", "Resident 2"));
        avl.insert(createResident("A-103", "Resident 3"));

        assertEquals(3, avl.getSize());
        assertTrue(avl.getTotalRotations() > 0);
        assertTrue(avl.getLastRotationType().contains("RR"));

        // Inorder must remain sorted
        List<Resident> sorted = avl.inOrderTraversal();
        assertEquals("A-101", sorted.get(0).getFlatNumber());
        assertEquals("A-102", sorted.get(1).getFlatNumber());
        assertEquals("A-103", sorted.get(2).getFlatNumber());
    }

    @Test
    @DisplayName("Should trigger LL Rotation (Right Rotate) on left-heavy insertion")
    void testLLRotation() {
        // Inserting descending keys triggers LL rotation
        avl.insert(createResident("A-303", "Resident 3"));
        avl.insert(createResident("A-302", "Resident 2"));
        avl.insert(createResident("A-301", "Resident 1"));

        assertEquals(3, avl.getSize());
        assertTrue(avl.getTotalRotations() > 0);
        assertTrue(avl.getLastRotationType().contains("LL"));

        List<Resident> sorted = avl.inOrderTraversal();
        assertEquals("A-301", sorted.get(0).getFlatNumber());
        assertEquals("A-302", sorted.get(1).getFlatNumber());
        assertEquals("A-303", sorted.get(2).getFlatNumber());
    }

    @Test
    @DisplayName("Should maintain AVL balance and support search with path trace")
    void testSearchAndBalance() {
        String[] flats = {"A-101", "A-102", "A-201", "A-202", "B-101", "B-102", "B-201"};
        for (String f : flats) {
            avl.insert(createResident(f, "Resident " + f));
        }

        assertEquals(7, avl.getSize());

        // Search existing
        Map<String, Object> found = avl.searchWithTrace("B-101");
        assertTrue((Boolean) found.get("found"));
        assertNotNull(found.get("resident"));
        assertTrue((Integer) found.get("steps") > 0);

        // Search non-existing
        Map<String, Object> notFound = avl.searchWithTrace("Z-999");
        assertFalse((Boolean) notFound.get("found"));
        assertNull(notFound.get("resident"));
    }

    @Test
    @DisplayName("Should delete node and maintain AVL balance")
    void testDeletionAndRebalancing() {
        avl.insert(createResident("A-101", "Resident 1"));
        avl.insert(createResident("A-102", "Resident 2"));
        avl.insert(createResident("A-103", "Resident 3"));
        avl.insert(createResident("A-104", "Resident 4"));

        assertEquals(4, avl.getSize());

        avl.delete("A-102");
        assertEquals(3, avl.getSize());
        assertNull(avl.search("A-102"));
        assertNotNull(avl.search("A-101"));
        assertNotNull(avl.search("A-103"));
        assertNotNull(avl.search("A-104"));
    }
}
