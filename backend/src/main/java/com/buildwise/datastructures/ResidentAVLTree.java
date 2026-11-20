package com.buildwise.datastructures;

import com.buildwise.model.Resident;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Data Structure 8: AVL Tree (Self-Balancing Binary Search Tree)
 * Application: Fast O(log N) Resident Indexing & Flat Searching
 * 
 * Demonstrates:
 * - Strict AVL Invariant: Balance Factor BF ∈ {-1, 0, 1} for every node
 * - Height maintenance: height = 1 + max(left.height, right.height)
 * - LL Rotation (Single Right Rotate)
 * - RR Rotation (Single Left Rotate)
 * - LR Rotation (Double Rotate: Left child rotate left, then current rotate right)
 * - RL Rotation (Double Rotate: Right child rotate right, then current rotate left)
 * - Rebalancing after both INSERT and DELETE operations
 * - Inorder traversal yielding lexicographically sorted flat residents
 */
@Component
public class ResidentAVLTree {

    public static class AVLNode {
        public String key;              // Flat Number, e.g. "A-101"
        public Resident resident;
        public int height;
        public AVLNode left;
        public AVLNode right;

        public AVLNode(Resident resident) {
            this.key = resident.getFlatNumber();
            this.resident = resident;
            this.height = 1;
        }

        public int getBalanceFactor() {
            int leftHeight = (left != null) ? left.height : 0;
            int rightHeight = (right != null) ? right.height : 0;
            return leftHeight - rightHeight;
        }
    }

    private AVLNode root;
    @Getter
    private int size = 0;
    @Getter
    private int totalRotations = 0;
    @Getter
    private String lastRotationType = "None";

    public synchronized void clear() {
        this.root = null;
        this.size = 0;
        this.totalRotations = 0;
        this.lastRotationType = "None";
    }

    public int height(AVLNode node) {
        return (node == null) ? 0 : node.height;
    }

    public int getBalance(AVLNode node) {
        return (node == null) ? 0 : height(node.left) - height(node.right);
    }

    /**
     * Right Rotation (LL Case)
     *          y                              x
     *         / \                            / \
     *        x   T3   -- Right Rotate -->   T1  y
     *       / \                                / \
     *      T1  T2                             T2  T3
     */
    private AVLNode rightRotate(AVLNode y) {
        AVLNode x = y.left;
        AVLNode T2 = x.right;

        // Perform rotation
        x.right = y;
        y.left = T2;

        // Update heights
        y.height = Math.max(height(y.left), height(y.right)) + 1;
        x.height = Math.max(height(x.left), height(x.right)) + 1;

        totalRotations++;
        lastRotationType = "LL Rotation (Right Rotate on " + y.key + ")";
        return x;
    }

    /**
     * Left Rotation (RR Case)
     *        x                                y
     *       / \                              / \
     *      T1  y      -- Left Rotate -->    x   T3
     *         / \                          / \
     *        T2  T3                       T1  T2
     */
    private AVLNode leftRotate(AVLNode x) {
        AVLNode y = x.right;
        AVLNode T2 = y.left;

        // Perform rotation
        y.left = x;
        x.right = T2;

        // Update heights
        x.height = Math.max(height(x.left), height(x.right)) + 1;
        y.height = Math.max(height(y.left), height(y.right)) + 1;

        totalRotations++;
        lastRotationType = "RR Rotation (Left Rotate on " + x.key + ")";
        return y;
    }

    public synchronized void insert(Resident resident) {
        if (resident == null || resident.getFlatNumber() == null) return;
        root = insertRecursive(root, resident);
    }

    private AVLNode insertRecursive(AVLNode node, Resident resident) {
        String key = resident.getFlatNumber().trim();

        // 1. Perform normal BST insertion
        if (node == null) {
            size++;
            return new AVLNode(resident);
        }

        int cmp = key.compareTo(node.key);
        if (cmp < 0) {
            node.left = insertRecursive(node.left, resident);
        } else if (cmp > 0) {
            node.right = insertRecursive(node.right, resident);
        } else {
            // Duplicate key: update resident data
            node.resident = resident;
            return node;
        }

        // 2. Update height of current node
        node.height = 1 + Math.max(height(node.left), height(node.right));

        // 3. Get balance factor to check if this node became unbalanced
        int balance = getBalance(node);

        // 4. Handle 4 rotation cases:

        // Case 1: Left-Left (LL)
        if (balance > 1 && key.compareTo(node.left.key) < 0) {
            return rightRotate(node);
        }

        // Case 2: Right-Right (RR)
        if (balance < -1 && key.compareTo(node.right.key) > 0) {
            return leftRotate(node);
        }

        // Case 3: Left-Right (LR)
        if (balance > 1 && key.compareTo(node.left.key) > 0) {
            lastRotationType = "LR Rotation (Left on " + node.left.key + ", then Right on " + node.key + ")";
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }

        // Case 4: Right-Left (RL)
        if (balance < -1 && key.compareTo(node.right.key) < 0) {
            lastRotationType = "RL Rotation (Right on " + node.right.key + ", then Left on " + node.key + ")";
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        return node;
    }

    public synchronized void delete(String key) {
        if (key == null || root == null) return;
        root = deleteRecursive(root, key.trim());
    }

    private AVLNode deleteRecursive(AVLNode root, String key) {
        // 1. Standard BST delete
        if (root == null) return null;

        int cmp = key.compareTo(root.key);
        if (cmp < 0) {
            root.left = deleteRecursive(root.left, key);
        } else if (cmp > 0) {
            root.right = deleteRecursive(root.right, key);
        } else {
            // Node to be deleted found
            size--;

            // Case with only one child or no child
            if (root.left == null || root.right == null) {
                AVLNode temp = (root.left != null) ? root.left : root.right;
                if (temp == null) {
                    // No child
                    root = null;
                } else {
                    // One child
                    root = temp;
                }
            } else {
                // Node with two children: Get the inorder successor (smallest in the right subtree)
                AVLNode temp = minValueNode(root.right);
                root.key = temp.key;
                root.resident = temp.resident;
                // Delete the inorder successor
                root.right = deleteRecursive(root.right, temp.key);
                size++; // Compensate because recursive call decrements size again
            }
        }

        if (root == null) return null;

        // 2. Update height
        root.height = 1 + Math.max(height(root.left), height(root.right));

        // 3. Get balance factor
        int balance = getBalance(root);

        // 4. Rebalance if needed:
        // LL Case
        if (balance > 1 && getBalance(root.left) >= 0) {
            return rightRotate(root);
        }

        // LR Case
        if (balance > 1 && getBalance(root.left) < 0) {
            nodeRotated(root.left.key, root.key, "LR");
            root.left = leftRotate(root.left);
            return rightRotate(root);
        }

        // RR Case
        if (balance < -1 && getBalance(root.right) <= 0) {
            return leftRotate(root);
        }

        // RL Case
        if (balance < -1 && getBalance(root.right) > 0) {
            nodeRotated(root.right.key, root.key, "RL");
            root.right = rightRotate(root.right);
            return leftRotate(root);
        }

        return root;
    }

    private void nodeRotated(String k1, String k2, String type) {
        lastRotationType = type + " Rotation on " + k1 + " and " + k2;
    }

    private AVLNode minValueNode(AVLNode node) {
        AVLNode current = node;
        while (current.left != null) {
            current = current.left;
        }
        return current;
    }

    public synchronized Map<String, Object> searchWithTrace(String flatNumber) {
        Map<String, Object> trace = new HashMap<>();
        List<String> path = new ArrayList<>();
        int steps = 0;

        if (flatNumber == null || root == null) {
            trace.put("found", false);
            trace.put("steps", 0);
            trace.put("path", path);
            trace.put("resident", null);
            return trace;
        }

        String searchKey = flatNumber.trim();
        AVLNode current = root;

        while (current != null) {
            steps++;
            path.add(current.key);
            int cmp = searchKey.compareTo(current.key);
            if (cmp == 0) {
                trace.put("found", true);
                trace.put("steps", steps);
                trace.put("path", path);
                trace.put("resident", current.resident);
                return trace;
            } else if (cmp < 0) {
                current = current.left;
            } else {
                current = current.right;
            }
        }

        trace.put("found", false);
        trace.put("steps", steps);
        trace.put("path", path);
        trace.put("resident", null);
        return trace;
    }

    public synchronized Resident search(String flatNumber) {
        Map<String, Object> res = searchWithTrace(flatNumber);
        return (Resident) res.get("resident");
    }

    public synchronized List<Resident> inOrderTraversal() {
        List<Resident> list = new ArrayList<>();
        inOrderRecursive(root, list);
        return list;
    }

    private void inOrderRecursive(AVLNode node, List<Resident> list) {
        if (node != null) {
            inOrderRecursive(node.left, list);
            list.add(node.resident);
            inOrderRecursive(node.right, list);
        }
    }

    public synchronized void rebuild(List<Resident> residents) {
        clear();
        for (Resident r : residents) {
            if (r.isActive()) {
                insert(r);
            }
        }
    }

    public synchronized Map<String, Object> getTreeVisualization() {
        Map<String, Object> map = new HashMap<>();
        map.put("structure", "AVL Tree (Self-Balancing)");
        map.put("size", size);
        map.put("rootHeight", height(root));
        map.put("totalRotations", totalRotations);
        map.put("lastRotationType", lastRotationType);
        map.put("inOrderResidents", inOrderTraversal());
        map.put("treeHierarchy", buildTreeHierarchyDto(root));
        return map;
    }

    private Map<String, Object> buildTreeHierarchyDto(AVLNode node) {
        if (node == null) return null;
        Map<String, Object> dto = new HashMap<>();
        dto.put("key", node.key);
        dto.put("residentName", node.resident.getName());
        dto.put("building", node.resident.getBuilding());
        dto.put("occupancyStatus", node.resident.getOccupancyStatus());
        dto.put("height", node.height);
        dto.put("balanceFactor", node.getBalanceFactor());
        dto.put("left", buildTreeHierarchyDto(node.left));
        dto.put("right", buildTreeHierarchyDto(node.right));
        return dto;
    }
}
