package com.buildwise.datastructures;

import com.buildwise.model.ComplaintActivity;
import com.buildwise.model.ResidentActivity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.LinkedList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Data Structure 2: LinkedList Tests - Resident & Complaint Activity")
public class LinkedListTest {

    private ResidentActivityManager manager;

    @BeforeEach
    void setUp() {
        manager = new ResidentActivityManager();
    }

    @Test
    @DisplayName("Should maintain head-first chronological order and sequential traversal")
    void testSequentialActivityTraversal() {
        ResidentActivity a1 = ResidentActivity.builder().activityId("ACT-1").residentId("RES-1").actionType("REGISTRATION").timestamp(LocalDateTime.now().minusHours(2)).build();
        ResidentActivity a2 = ResidentActivity.builder().activityId("ACT-2").residentId("RES-1").actionType("PAYMENT").timestamp(LocalDateTime.now().minusHours(1)).build();
        ResidentActivity a3 = ResidentActivity.builder().activityId("ACT-3").residentId("RES-2").actionType("COMPLAINT").timestamp(LocalDateTime.now()).build();

        manager.addActivity(a1);
        manager.addActivity(a2);
        manager.addActivity(a3);

        List<ResidentActivity> all = manager.getAllActivities();
        assertEquals(3, all.size());
        // Head must be newest (ACT-3)
        assertEquals("ACT-3", all.get(0).getActivityId());
        assertEquals("ACT-2", all.get(1).getActivityId());
        assertEquals("ACT-1", all.get(2).getActivityId());

        // Sequential traversal by resident
        List<ResidentActivity> res1Acts = manager.getActivitiesForResident("RES-1");
        assertEquals(2, res1Acts.size());
    }

    @Test
    @DisplayName("Should track chronological complaint timeline in LinkedList")
    void testComplaintTimeline() {
        ComplaintActivity c1 = ComplaintActivity.builder().activityId("CA-1").complaintId("CMP-1").action("Submitted").timestamp(LocalDateTime.now().minusHours(3)).build();
        ComplaintActivity c2 = ComplaintActivity.builder().activityId("CA-2").complaintId("CMP-1").action("Assigned").timestamp(LocalDateTime.now().minusHours(2)).build();
        ComplaintActivity c3 = ComplaintActivity.builder().activityId("CA-3").complaintId("CMP-1").action("Resolved").timestamp(LocalDateTime.now().minusHours(1)).build();

        manager.addComplaintActivity("CMP-1", c1);
        manager.addComplaintActivity("CMP-1", c2);
        manager.addComplaintActivity("CMP-1", c3);

        LinkedList<ComplaintActivity> timeline = manager.getComplaintTimeline("CMP-1");
        assertEquals(3, timeline.size());
        assertEquals("CA-1", timeline.getFirst().getActivityId());
        assertEquals("CA-3", timeline.getLast().getActivityId());
    }
}
