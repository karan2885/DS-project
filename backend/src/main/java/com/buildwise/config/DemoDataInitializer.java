package com.buildwise.config;

import com.buildwise.datastructures.*;
import com.buildwise.dto.ResetDemoDataResponse;
import com.buildwise.model.*;
import com.buildwise.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DemoDataInitializer implements CommandLineRunner {

    private final ResidentRepository residentRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final ExpenseRepository expenseRepository;
    private final ComplaintRepository complaintRepository;
    private final VisitorRepository visitorRepository;
    private final NoticeRepository noticeRepository;
    private final ResidentActivityRepository residentActivityRepository;
    private final AdminOperationRepository adminOperationRepository;
    private final BuildingNodeRepository buildingNodeRepository;
    private final SocietyConfigRepository societyConfigRepository;

    private final PaymentRecordManager paymentRecordManager;
    private final ResidentActivityManager residentActivityManager;
    private final UndoManager undoManager;
    private final ComplaintQueueManager complaintQueueManager;
    private final ComplaintPriorityManager complaintPriorityManager;
    private final MaintenanceBST maintenanceBST;
    private final BuildingGraph buildingGraph;
    private final ResidentAVLTree residentAVLTree;

    @Override
    public void run(String... args) {
        log.info("Checking Green Valley Residency, Surat database state...");
        
        // Prevent duplicate demo insertion on server restart
        boolean alreadyInitialized = societyConfigRepository.count() > 0 && residentRepository.count() >= 30;

        if (!alreadyInitialized) {
            log.info("Performing first-time Indian demo data population for Green Valley Residency, Vesu, Surat...");
            seedDemoData(false);
        } else {
            log.info("Demo data already present ({} residents). Skipping duplicate seeding.", residentRepository.count());
            synchronizeDataStructures();
        }
    }

    public synchronized ResetDemoDataResponse resetAndReseedDemoData() {
        log.info("Resetting society operations: making paid maintenance pending, complaints open, resetting income/expenses, preserving resident & flat details...");

        // Ensure baseline residents, building topology, and config exist
        if (societyConfigRepository.count() == 0) {
            seedSocietyConfig();
        }
        if (residentRepository.count() == 0) {
            seedResidents();
        }
        if (buildingNodeRepository.count() == 0) {
            seedBuildingTopology();
        }

        // 1. Make all paid maintenance flats pending (UNPAID)
        List<MaintenanceRecord> records = maintenanceRepository.findAll();
        if (records.isEmpty()) {
            seedMaintenanceRecords();
            records = maintenanceRepository.findAll();
        }
        for (MaintenanceRecord r : records) {
            r.setPaymentStatus("UNPAID");
            r.setPaymentDate(null);
            r.setPaymentMethod(null);
            r.setReceiptNumber(null);
            r.setLateFee(0.0);
            double baseAmount = r.getAmount() > 0 ? r.getAmount() : 2500.0;
            r.setAmount(baseAmount);
            r.setTotalAmount(baseAmount);
            r.setUpdatedAt(LocalDateTime.now());
        }
        maintenanceRepository.saveAll(records);

        // 2. Make all processed complaints pending (SUBMITTED)
        List<Complaint> complaints = complaintRepository.findAll();
        if (complaints.isEmpty()) {
            seedComplaints();
            complaints = complaintRepository.findAll();
        }
        for (Complaint c : complaints) {
            c.setStatus("SUBMITTED");
            c.setAssignedStaff(null);
            c.setStaffContact(null);
            c.setAssignedDate(null);
            c.setResolutionDescription(null);
            c.setWorkPerformed(null);
            c.setResolvedBy(null);
            c.setResolvedTime(null);
            c.setClosureReason(null);
            c.setClosedBy(null);
            c.setClosureTime(null);
            c.setReopenedReason(null);
            c.setReopenedBy(null);
            c.setReopenedTime(null);

            List<ComplaintActivity> initialActs = new ArrayList<>();
            initialActs.add(ComplaintActivity.builder()
                    .activityId("ACT-INIT-" + c.getComplaintId())
                    .complaintId(c.getComplaintId())
                    .action("Complaint Submitted")
                    .performedBy(c.getResidentName() != null ? c.getResidentName() : "Resident")
                    .timestamp(c.getSubmissionTime() != null ? c.getSubmissionTime() : LocalDateTime.now().minusDays(1))
                    .remarks("Initial complaint registration pending administrative review")
                    .build());
            c.setActivityHistory(initialActs);
        }
        complaintRepository.saveAll(complaints);

        // 3. Reset Income and Expenses as new
        expenseRepository.deleteAll();
        adminOperationRepository.deleteAll();
        undoManager.clear();

        // 4. Reset resident activities to clean state
        residentActivityRepository.deleteAll();
        List<Resident> residents = residentRepository.findAll();
        List<ResidentActivity> allActivities = new ArrayList<>();
        for (Resident r : residents) {
            ResidentActivity act = ResidentActivity.builder()
                    .activityId("ACT-INIT-" + r.getFlatNumber())
                    .residentId(r.getResidentId())
                    .residentName(r.getName())
                    .flatNumber(r.getFlatNumber())
                    .actionType("REGISTRATION")
                    .description("Resident " + r.getName() + " onboarded to Flat " + r.getFlatNumber() + " (" + r.getBuilding() + ")")
                    .performedBy("System")
                    .timestamp(LocalDateTime.now().minusDays(1))
                    .build();
            allActivities.add(act);
        }
        residentActivityRepository.saveAll(allActivities);
        residentActivityManager.setActivities(allActivities);

        // 5. Reset all Visitors to clean pending state ("Waiting at Gate" / "Pending Approval")
        List<Visitor> visitors = visitorRepository.findAll();
        if (visitors.isEmpty()) {
            seedVisitors();
            visitors = visitorRepository.findAll();
        }
        for (Visitor v : visitors) {
            v.setStatus("PENDING");
            v.setEntryTime(null);
            v.setExitTime(null);
        }
        visitorRepository.saveAll(visitors);

        // 6. Synchronize all Data Structures
        paymentRecordManager.setPaymentRecords(records);
        paymentRecordManager.setExpenseRecords(new ArrayList<>());
        complaintQueueManager.initializeQueue(complaints);
        complaintPriorityManager.initializePriorityQueue(complaints);
        maintenanceBST.rebuild(records);
        residentAVLTree.rebuild(residentRepository.findByActive(true));

        log.info("Reset completed successfully. Residents & flats preserved. All maintenance set to pending, complaints open, visitors reset to pending entry, expenses cleared.");

        return ResetDemoDataResponse.builder()
                .success(true)
                .message("All paid maintenance set to pending, processed complaints reopened, visitors reset to pending entry approval, and income/expenses reset as new. Resident and flat details were preserved.")
                .residentsCount((int) residentRepository.count())
                .flatsCount((int) buildingNodeRepository.findByType("FLAT").size())
                .maintenanceRecordsCount((int) maintenanceRepository.count())
                .complaintsCount((int) complaintRepository.count())
                .visitorsCount((int) visitorRepository.count())
                .expensesCount((int) expenseRepository.count())
                .noticesCount((int) noticeRepository.count())
                .timestamp(LocalDateTime.now())
                .build();
    }

    private synchronized ResetDemoDataResponse seedDemoData(boolean forceClean) {
        if (forceClean) {
            residentRepository.deleteAll();
            maintenanceRepository.deleteAll();
            expenseRepository.deleteAll();
            complaintRepository.deleteAll();
            visitorRepository.deleteAll();
            noticeRepository.deleteAll();
            residentActivityRepository.deleteAll();
            adminOperationRepository.deleteAll();
            buildingNodeRepository.deleteAll();
            societyConfigRepository.deleteAll();
        }

        // 1. Seed Society Profile
        seedSocietyConfig();

        // 2. Seed Indian Residents (32+ residents across A, B, C Wings)
        seedResidents();

        // 3. Seed Building Topology & Flats (48 flats, 3 Wings, 4 floors each, facilities)
        seedBuildingTopology();

        // 4. Seed Maintenance Records (in INR ₹)
        seedMaintenanceRecords();

        // 5. Seed Society Expenses (in INR ₹)
        seedExpenses();

        // 6. Seed Complaints with complete functional lifecycle
        seedComplaints();

        // 7. Seed Visitors (+91 mobile numbers)
        seedVisitors();

        // 8. Seed Society Notices (Indian societal context)
        seedNotices();

        // 9. Synchronize all 8 Data Structures
        synchronizeDataStructures();

        log.info("Green Valley Residency successfully seeded with Indian demo records and 8 synchronized Data Structures!");

        return ResetDemoDataResponse.builder()
                .success(true)
                .message("Successfully reset and seeded Indian demo dataset for Green Valley Residency, Vesu, Surat.")
                .residentsCount((int) residentRepository.count())
                .flatsCount((int) buildingNodeRepository.findByType("FLAT").size())
                .maintenanceRecordsCount((int) maintenanceRepository.count())
                .complaintsCount((int) complaintRepository.count())
                .visitorsCount((int) visitorRepository.count())
                .expensesCount((int) expenseRepository.count())
                .noticesCount((int) noticeRepository.count())
                .timestamp(LocalDateTime.now())
                .build();
    }

    private void seedSocietyConfig() {
        SocietyConfig config = SocietyConfig.builder()
                .societyName("Green Valley Residency")
                .location("Vesu, Surat, Gujarat, India")
                .address("Plot No. 12-16, VIP Road, Near GD Goenka School, Vesu")
                .city("Surat")
                .state("Gujarat")
                .postalCode("395007")
                .registrationNumber("GUJ/SRT/HSG/2022/4921")
                .currencySymbol("₹")
                .currencyCode("INR")
                .baseMaintenanceAmount(2500.0)
                .lateFeeAmount(250.0)
                .lateFeeGraceDays(15)
                .currentBillingMonth("2026-03")
                .contactEmail("admin@greenvalley.in")
                .contactPhone("+91 98250 12345")
                .demoDataInitialized(true)
                .initializedAt(LocalDateTime.now())
                .lastResetAt(LocalDateTime.now())
                .build();
        societyConfigRepository.save(config);
    }

    private void seedResidents() {
        List<Resident> residents = List.of(
                // A Wing Residents (12 residents)
                Resident.builder().residentId("RES-1001").name("Karan Patel").flatNumber("A-101").building("A Wing").contactNumber("+91 98251 10101").email("karan.patel@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-01-15").active(true).createdAt(LocalDateTime.now().minusMonths(12)).updatedAt(LocalDateTime.now().minusMonths(12)).build(),
                Resident.builder().residentId("RES-1002").name("Rahul Shah").flatNumber("A-102").building("A Wing").contactNumber("+91 98251 10102").email("rahul.shah@greenvalley.in").occupancyStatus("TENANT").moveInDate("2023-05-01").active(true).createdAt(LocalDateTime.now().minusMonths(10)).updatedAt(LocalDateTime.now().minusMonths(10)).build(),
                Resident.builder().residentId("RES-1003").name("Priya Desai").flatNumber("A-103").building("A Wing").contactNumber("+91 98251 10103").email("priya.desai@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-02-10").active(true).createdAt(LocalDateTime.now().minusMonths(11)).updatedAt(LocalDateTime.now().minusMonths(11)).build(),
                Resident.builder().residentId("RES-1004").name("Amit Mehta").flatNumber("A-104").building("A Wing").contactNumber("+91 98251 10104").email("amit.mehta@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-03-20").active(true).createdAt(LocalDateTime.now().minusMonths(10)).updatedAt(LocalDateTime.now().minusMonths(10)).build(),
                Resident.builder().residentId("RES-1005").name("Neha Joshi").flatNumber("A-201").building("A Wing").contactNumber("+91 98251 10201").email("neha.joshi@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-06-12").active(true).createdAt(LocalDateTime.now().minusMonths(9)).updatedAt(LocalDateTime.now().minusMonths(9)).build(),
                Resident.builder().residentId("RES-1006").name("Harsh Trivedi").flatNumber("A-202").building("A Wing").contactNumber("+91 98251 10202").email("harsh.trivedi@greenvalley.in").occupancyStatus("TENANT").moveInDate("2024-01-10").active(true).createdAt(LocalDateTime.now().minusMonths(8)).updatedAt(LocalDateTime.now().minusMonths(8)).build(),
                Resident.builder().residentId("RES-1007").name("Riya Vyas").flatNumber("A-203").building("A Wing").contactNumber("+91 98251 10203").email("riya.vyas@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-04-18").active(true).createdAt(LocalDateTime.now().minusMonths(10)).updatedAt(LocalDateTime.now().minusMonths(10)).build(),
                Resident.builder().residentId("RES-1008").name("Dhruv Modi").flatNumber("A-204").building("A Wing").contactNumber("+91 98251 10204").email("dhruv.modi@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-08-01").active(true).createdAt(LocalDateTime.now().minusMonths(7)).updatedAt(LocalDateTime.now().minusMonths(7)).build(),
                Resident.builder().residentId("RES-1009").name("Anjali Shah").flatNumber("A-301").building("A Wing").contactNumber("+91 98251 10301").email("anjali.shah@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-02-01").active(true).createdAt(LocalDateTime.now().minusMonths(11)).updatedAt(LocalDateTime.now().minusMonths(11)).build(),
                Resident.builder().residentId("RES-1010").name("Yash Parmar").flatNumber("A-302").building("A Wing").contactNumber("+91 98251 10302").email("yash.parmar@greenvalley.in").occupancyStatus("TENANT").moveInDate("2024-02-15").active(true).createdAt(LocalDateTime.now().minusMonths(6)).updatedAt(LocalDateTime.now().minusMonths(6)).build(),
                Resident.builder().residentId("RES-1011").name("Meet Patel").flatNumber("A-401").building("A Wing").contactNumber("+91 98251 10401").email("meet.patel@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-01-20").active(true).createdAt(LocalDateTime.now().minusMonths(12)).updatedAt(LocalDateTime.now().minusMonths(12)).build(),
                Resident.builder().residentId("RES-1012").name("Krupa Desai").flatNumber("A-402").building("A Wing").contactNumber("+91 98251 10402").email("krupa.desai@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-07-15").active(true).createdAt(LocalDateTime.now().minusMonths(8)).updatedAt(LocalDateTime.now().minusMonths(8)).build(),

                // B Wing Residents (10 residents)
                Resident.builder().residentId("RES-2001").name("Bhavin Choksi").flatNumber("B-101").building("B Wing").contactNumber("+91 98252 20101").email("bhavin.choksi@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-03-01").active(true).createdAt(LocalDateTime.now().minusMonths(10)).updatedAt(LocalDateTime.now().minusMonths(10)).build(),
                Resident.builder().residentId("RES-2002").name("Pooja Kothari").flatNumber("B-102").building("B Wing").contactNumber("+91 98252 20102").email("pooja.kothari@greenvalley.in").occupancyStatus("TENANT").moveInDate("2023-09-01").active(true).createdAt(LocalDateTime.now().minusMonths(6)).updatedAt(LocalDateTime.now().minusMonths(6)).build(),
                Resident.builder().residentId("RES-2003").name("Chetan Solanki").flatNumber("B-103").building("B Wing").contactNumber("+91 98252 20103").email("chetan.solanki@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-04-10").active(true).createdAt(LocalDateTime.now().minusMonths(9)).updatedAt(LocalDateTime.now().minusMonths(9)).build(),
                Resident.builder().residentId("RES-2004").name("Deepika Bhatia").flatNumber("B-201").building("B Wing").contactNumber("+91 98252 20201").email("deepika.bhatia@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-05-15").active(true).createdAt(LocalDateTime.now().minusMonths(8)).updatedAt(LocalDateTime.now().minusMonths(8)).build(),
                Resident.builder().residentId("RES-2005").name("Jignesh Vora").flatNumber("B-202").building("B Wing").contactNumber("+91 98252 20202").email("jignesh.vora@greenvalley.in").occupancyStatus("TENANT").moveInDate("2024-03-01").active(true).createdAt(LocalDateTime.now().minusMonths(5)).updatedAt(LocalDateTime.now().minusMonths(5)).build(),
                Resident.builder().residentId("RES-2006").name("Kinjal Kapadia").flatNumber("B-203").building("B Wing").contactNumber("+91 98252 20203").email("kinjal.kapadia@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-06-01").active(true).createdAt(LocalDateTime.now().minusMonths(8)).updatedAt(LocalDateTime.now().minusMonths(8)).build(),
                Resident.builder().residentId("RES-2007").name("Nirav Jariwala").flatNumber("B-301").building("B Wing").contactNumber("+91 98252 20301").email("nirav.jariwala@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-02-15").active(true).createdAt(LocalDateTime.now().minusMonths(11)).updatedAt(LocalDateTime.now().minusMonths(11)).build(),
                Resident.builder().residentId("RES-2008").name("Sonal Zaveri").flatNumber("B-302").building("B Wing").contactNumber("+91 98252 20302").email("sonal.zaveri@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-08-20").active(true).createdAt(LocalDateTime.now().minusMonths(7)).updatedAt(LocalDateTime.now().minusMonths(7)).build(),
                Resident.builder().residentId("RES-2009").name("Pratik Gajiwala").flatNumber("B-401").building("B Wing").contactNumber("+91 98252 20401").email("pratik.gajiwala@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-01-25").active(true).createdAt(LocalDateTime.now().minusMonths(12)).updatedAt(LocalDateTime.now().minusMonths(12)).build(),
                Resident.builder().residentId("RES-2010").name("Varsha Gilitwala").flatNumber("B-402").building("B Wing").contactNumber("+91 98252 20402").email("varsha.gilitwala@greenvalley.in").occupancyStatus("TENANT").moveInDate("2024-01-05").active(true).createdAt(LocalDateTime.now().minusMonths(7)).updatedAt(LocalDateTime.now().minusMonths(7)).build(),

                // C Wing Residents (10 residents)
                Resident.builder().residentId("RES-3001").name("Manish Randeria").flatNumber("C-101").building("C Wing").contactNumber("+91 98253 30101").email("manish.randeria@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-04-01").active(true).createdAt(LocalDateTime.now().minusMonths(9)).updatedAt(LocalDateTime.now().minusMonths(9)).build(),
                Resident.builder().residentId("RES-3002").name("Kavita Marfatia").flatNumber("C-102").building("C Wing").contactNumber("+91 98253 30102").email("kavita.marfatia@greenvalley.in").occupancyStatus("TENANT").moveInDate("2023-11-10").active(true).createdAt(LocalDateTime.now().minusMonths(6)).updatedAt(LocalDateTime.now().minusMonths(6)).build(),
                Resident.builder().residentId("RES-3003").name("Hiren Bardolia").flatNumber("C-103").building("C Wing").contactNumber("+91 98253 30103").email("hiren.bardolia@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-05-20").active(true).createdAt(LocalDateTime.now().minusMonths(8)).updatedAt(LocalDateTime.now().minusMonths(8)).build(),
                Resident.builder().residentId("RES-3004").name("Bina Gheewala").flatNumber("C-201").building("C Wing").contactNumber("+91 98253 30201").email("bina.gheewala@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-06-25").active(true).createdAt(LocalDateTime.now().minusMonths(8)).updatedAt(LocalDateTime.now().minusMonths(8)).build(),
                Resident.builder().residentId("RES-3005").name("Sanjay Doctor").flatNumber("C-202").building("C Wing").contactNumber("+91 98253 30202").email("sanjay.doctor@greenvalley.in").occupancyStatus("TENANT").moveInDate("2024-02-01").active(true).createdAt(LocalDateTime.now().minusMonths(6)).updatedAt(LocalDateTime.now().minusMonths(6)).build(),
                Resident.builder().residentId("RES-3006").name("Radhika Vakil").flatNumber("C-203").building("C Wing").contactNumber("+91 98253 30203").email("radhika.vakil@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-07-01").active(true).createdAt(LocalDateTime.now().minusMonths(8)).updatedAt(LocalDateTime.now().minusMonths(8)).build(),
                Resident.builder().residentId("RES-3007").name("Gaurav Suratwala").flatNumber("C-301").building("C Wing").contactNumber("+91 98253 30301").email("gaurav.suratwala@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-03-15").active(true).createdAt(LocalDateTime.now().minusMonths(10)).updatedAt(LocalDateTime.now().minusMonths(10)).build(),
                Resident.builder().residentId("RES-3008").name("Smita Dalal").flatNumber("C-302").building("C Wing").contactNumber("+91 98253 30302").email("smita.dalal@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-09-15").active(true).createdAt(LocalDateTime.now().minusMonths(6)).updatedAt(LocalDateTime.now().minusMonths(6)).build(),
                Resident.builder().residentId("RES-3009").name("Ashwin Contractor").flatNumber("C-401").building("C Wing").contactNumber("+91 98253 30401").email("ashwin.contractor@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-02-10").active(true).createdAt(LocalDateTime.now().minusMonths(11)).updatedAt(LocalDateTime.now().minusMonths(11)).build(),
                Resident.builder().residentId("RES-3010").name("Falguni Nanavati").flatNumber("C-402").building("C Wing").contactNumber("+91 98253 30402").email("falguni.nanavati@greenvalley.in").occupancyStatus("OWNER").moveInDate("2023-08-05").active(true).createdAt(LocalDateTime.now().minusMonths(7)).updatedAt(LocalDateTime.now().minusMonths(7)).build()
        );

        residentRepository.saveAll(residents);
        log.info("Seeded {} Indian demo residents", residents.size());
    }

    private void seedBuildingTopology() {
        buildingGraph.clear();
        List<BuildingNode> nodes = new ArrayList<>();

        // 1. Shared Facilities
        buildingGraph.addVertex("FAC-GATE", "Main Security Gate", "FACILITY", null, "Boom barrier, visitor kiosk, and 24x7 security post");
        buildingGraph.addVertex("FAC-CLUB", "Clubhouse & Community Hall", "FACILITY", null, "Multi-purpose indoor community center");
        buildingGraph.addVertex("FAC-GYM", "Health & Fitness Gym", "FACILITY", null, "Modern gymnasium with cardio and weights");
        buildingGraph.addVertex("FAC-POOL", "Swimming Pool", "FACILITY", null, "Covered society swimming pool");
        buildingGraph.addVertex("FAC-GARDEN", "Children Play Garden", "FACILITY", null, "Lush landscape with jogging track");
        buildingGraph.addVertex("FAC-PARK", "Basement Parking", "FACILITY", null, "Two-level reserved resident parking");

        nodes.add(BuildingNode.builder().nodeId("FAC-GATE").name("Main Security Gate").type("FACILITY").description("Boom barrier & gate post").build());
        nodes.add(BuildingNode.builder().nodeId("FAC-CLUB").name("Clubhouse").type("FACILITY").description("Society hall").build());
        nodes.add(BuildingNode.builder().nodeId("FAC-GYM").name("Fitness Gym").type("FACILITY").description("Health center").build());
        nodes.add(BuildingNode.builder().nodeId("FAC-POOL").name("Swimming Pool").type("FACILITY").description("Pool area").build());
        nodes.add(BuildingNode.builder().nodeId("FAC-GARDEN").name("Play Garden").type("FACILITY").description("Lawn & play area").build());
        nodes.add(BuildingNode.builder().nodeId("FAC-PARK").name("Basement Parking").type("FACILITY").description("Car parking").build());

        // 2. Wings (A, B, C Wing)
        String[] wings = {"A Wing", "B Wing", "C Wing"};
        String[] wingIds = {"BLDG-A", "BLDG-B", "BLDG-C"};

        for (int w = 0; w < wings.length; w++) {
            String wId = wingIds[w];
            String wName = wings[w];

            buildingGraph.addVertex(wId, wName, "BUILDING", null, "Residential " + wName + " (4 Floors, 16 Flats)");
            nodes.add(BuildingNode.builder().nodeId(wId).name(wName).type("BUILDING").description("4 Floors, 16 Flats").build());

            // Connect facility to Wing
            buildingGraph.addEdge("FAC-GATE", wId, "MAIN_INTERNAL_ROAD", 1.0);
            buildingGraph.addEdge(wId, "FAC-CLUB", "CENTRAL_PATHWAY", 1.2);
            buildingGraph.addEdge(wId, "FAC-PARK", "RAMP_ACCESS", 1.0);

            // 4 Floors per building
            char prefix = wName.charAt(0); // 'A', 'B', 'C'
            for (int f = 1; f <= 4; f++) {
                String flrId = "FLR-" + prefix + f;
                String flrName = "Floor " + f + " (" + wName + ")";

                buildingGraph.addVertex(flrId, flrName, "FLOOR", wId, "Level " + f + " of " + wName);
                nodes.add(BuildingNode.builder().nodeId(flrId).name(flrName).type("FLOOR").parentId(wId).build());

                // Connect Building to Floor 1, and consecutive floors together
                if (f == 1) {
                    buildingGraph.addEdge(wId, flrId, "LIFT_LOBBY", 1.0);
                } else {
                    String prevFlr = "FLR-" + prefix + (f - 1);
                    buildingGraph.addEdge(prevFlr, flrId, "STAIRS_LIFT", 1.0);
                }

                // 4 Flats per floor -> 16 flats per Wing -> 48 total flats!
                for (int flatNum = 1; flatNum <= 4; flatNum++) {
                    String flatKey = prefix + "-" + f + "0" + flatNum; // e.g. A-101, A-102, A-201, B-101, C-404
                    String flatName = "Flat " + flatKey;

                    buildingGraph.addVertex(flatKey, flatName, "FLAT", flrId, "3-BHK Residential Flat");
                    nodes.add(BuildingNode.builder().nodeId(flatKey).name(flatName).type("FLAT").parentId(flrId).build());

                    buildingGraph.addEdge(flrId, flatKey, "CORRIDOR_ENTRY", 0.5);
                }
            }
        }

        // Shared facility links
        buildingGraph.addEdge("FAC-CLUB", "FAC-GYM", "INDOOR_PASSAGE", 0.5);
        buildingGraph.addEdge("FAC-CLUB", "FAC-POOL", "POOL_DECK", 0.5);
        buildingGraph.addEdge("FAC-CLUB", "FAC-GARDEN", "GARDEN_PATH", 0.8);

        buildingNodeRepository.saveAll(nodes);
        log.info("Initialized Green Valley Residency Graph Topology: {} vertices, {} edges (48 total flats)",
                buildingGraph.getAllVertices().size(), buildingGraph.getAllEdges().size());
    }

    private void seedMaintenanceRecords() {
        List<MaintenanceRecord> records = new ArrayList<>();
        String[] months = {"2025-11", "2025-12", "2026-01", "2026-02", "2026-03"};
        List<Resident> residents = residentRepository.findAll();
        int count = 1;

        double baseAmount = 2500.0; // ₹2,500 INR monthly maintenance
        double lateFeeRate = 250.0; // ₹250 INR late fee

        for (String m : months) {
            for (Resident r : residents) {
                boolean isPaid = !(m.equals("2026-03") && (r.getFlatNumber().endsWith("02") || r.getFlatNumber().endsWith("03")));
                boolean isOverdue = m.equals("2026-02") && r.getFlatNumber().equals("A-202");
                String status = isPaid ? "PAID" : (isOverdue ? "OVERDUE" : "UNPAID");
                double lateFee = isOverdue ? lateFeeRate : 0.0;
                double total = baseAmount + lateFee;

                MaintenanceRecord rec = MaintenanceRecord.builder()
                        .recordId("MNT-" + m.replace("-", "") + "-" + String.format("%04d", count++))
                        .residentId(r.getResidentId())
                        .residentName(r.getName())
                        .flatNumber(r.getFlatNumber())
                        .building(r.getBuilding())
                        .monthYear(m)
                        .amount(baseAmount)
                        .lateFee(lateFee)
                        .totalAmount(total)
                        .paymentStatus(status)
                        .paymentDate(isPaid ? LocalDate.parse(m + "-10") : null)
                        .dueDate(LocalDate.parse(m + "-15"))
                        .paymentMethod(isPaid ? (count % 3 == 0 ? "UPI" : (count % 3 == 1 ? "BANK_TRANSFER" : "CHEQUE")) : null)
                        .receiptNumber(isPaid ? "GVR-RCP-" + String.format("%05d", count * 13) : null)
                        .createdAt(LocalDateTime.now().minusDays(35))
                        .updatedAt(LocalDateTime.now().minusDays(5))
                        .build();

                records.add(rec);
            }
        }

        maintenanceRepository.saveAll(records);
        log.info("Seeded {} INR maintenance records for Green Valley Residency", records.size());
    }

    private void seedExpenses() {
        List<Expense> expenses = List.of(
                Expense.builder().expenseId("EXP-2026-01").category("Lift Maintenance").amount(8500.0).expenseDate(LocalDate.of(2026, 1, 15)).description("Monthly Otis lift AMC and sensor lubrication for A, B, and C Wings").paidTo("Otis Elevators India Ltd").paymentMethod("BANK_TRANSFER").approvedBy("Hon. Secretary").createdAt(LocalDateTime.now().minusDays(45)).build(),
                Expense.builder().expenseId("EXP-2026-02").category("Security").amount(25000.0).expenseDate(LocalDate.of(2026, 1, 28)).description("6-guard security staff monthly payroll & boom barrier maintenance").paidTo("Surat Security Force Agency").paymentMethod("BANK_TRANSFER").approvedBy("Treasurer").createdAt(LocalDateTime.now().minusDays(35)).build(),
                Expense.builder().expenseId("EXP-2026-03").category("Cleaning").amount(12000.0).expenseDate(LocalDate.of(2026, 2, 5)).description("Corridor, staircase and basement floor deep cleaning contract").paidTo("CleanPro Facilities Surat").paymentMethod("UPI").approvedBy("Hon. Secretary").createdAt(LocalDateTime.now().minusDays(25)).build(),
                Expense.builder().expenseId("EXP-2026-04").category("Utilities").amount(9800.0).expenseDate(LocalDate.of(2026, 2, 18)).description("DGVCL common electricity bill: lift pumps, street lights, clubhouse").paidTo("Dakshin Gujarat Vij Company Ltd").paymentMethod("BANK_TRANSFER").approvedBy("Treasurer").createdAt(LocalDateTime.now().minusDays(18)).build(),
                Expense.builder().expenseId("EXP-2026-05").category("Landscaping").amount(3500.0).expenseDate(LocalDate.of(2026, 3, 2)).description("Garden lawn trimming, organic fertilizer, and sprinkler nozzle fixes").paidTo("Vesu Green Landscapers").paymentMethod("CHEQUE").approvedBy("Hon. Secretary").createdAt(LocalDateTime.now().minusDays(5)).build(),
                Expense.builder().expenseId("EXP-2026-06").category("Maintenance").amount(6500.0).expenseDate(LocalDate.of(2026, 2, 22)).description("Diesel generator fuel refill for power backup (150 liters)").paidTo("Indian Oil Petrol Pump, Vesu").paymentMethod("UPI").approvedBy("Admin").createdAt(LocalDateTime.now().minusDays(14)).build(),
                Expense.builder().expenseId("EXP-2026-07").category("Security").amount(4800.0).expenseDate(LocalDate.of(2026, 1, 10)).description("Hikvision CCTV cameras AMC and DVR hard drive health check").paidTo("Surat Vision Surveillance").paymentMethod("BANK_TRANSFER").approvedBy("Admin").createdAt(LocalDateTime.now().minusDays(50)).build(),
                Expense.builder().expenseId("EXP-2026-08").category("Maintenance").amount(4200.0).expenseDate(LocalDate.of(2026, 2, 28)).description("Overhead water tanks chemical cleaning and UV purification inspection").paidTo("Jal Clean Services, Surat").paymentMethod("CHEQUE").approvedBy("Hon. Secretary").createdAt(LocalDateTime.now().minusDays(8)).build(),
                Expense.builder().expenseId("EXP-2026-09").category("Administrative").amount(2200.0).expenseDate(LocalDate.of(2026, 3, 1)).description("Society office stationery, audit printouts, and visitor register books").paidTo("City Stationers, Athwa Lines").paymentMethod("CASH").approvedBy("Treasurer").createdAt(LocalDateTime.now().minusDays(6)).build(),
                Expense.builder().expenseId("EXP-2026-10").category("Plumbing").amount(2200.0).expenseDate(LocalDate.of(2026, 2, 12)).description("Main water pump valve replacement in B Wing pump room").paidTo("Mahadev Plumbing Works").paymentMethod("UPI").approvedBy("Admin").createdAt(LocalDateTime.now().minusDays(20)).build(),
                Expense.builder().expenseId("EXP-2026-11").category("Cleaning").amount(1800.0).expenseDate(LocalDate.of(2026, 1, 20)).description("Pest control and mosquito fogging across society premises").paidTo("PestFree Surat Co.").paymentMethod("UPI").approvedBy("Admin").createdAt(LocalDateTime.now().minusDays(40)).build(),
                Expense.builder().expenseId("EXP-2026-12").category("Maintenance").amount(5400.0).expenseDate(LocalDate.of(2026, 2, 14)).description("Swimming pool chlorination, filter replacement, and vacuuming").paidTo("AquaPure Pool Care").paymentMethod("BANK_TRANSFER").approvedBy("Hon. Secretary").createdAt(LocalDateTime.now().minusDays(18)).build(),
                Expense.builder().expenseId("EXP-2026-13").category("Utilities").amount(1150.0).expenseDate(LocalDate.of(2026, 2, 25)).description("Broadband fiber internet connection bill for society security cabin").paidTo("Jio Fiber Commercial").paymentMethod("UPI").approvedBy("Admin").createdAt(LocalDateTime.now().minusDays(10)).build(),
                Expense.builder().expenseId("EXP-2026-14").category("Administrative").amount(7500.0).expenseDate(LocalDate.of(2026, 1, 30)).description("Society annual financial audit and tax compliance legal fees").paidTo("C. P. Shah & Associates CA").paymentMethod("BANK_TRANSFER").approvedBy("Treasurer").createdAt(LocalDateTime.now().minusDays(33)).build(),
                Expense.builder().expenseId("EXP-2026-15").category("Maintenance").amount(3200.0).expenseDate(LocalDate.of(2026, 3, 4)).description("Fire extinguisher refilling and pressure gauge testing for all 3 Wings").paidTo("Gujarat Fire Safety Services").paymentMethod("CHEQUE").approvedBy("Hon. Secretary").createdAt(LocalDateTime.now().minusDays(3)).build()
        );

        expenseRepository.saveAll(expenses);
        log.info("Seeded {} Indian society expenses for Green Valley Residency", expenses.size());
    }

    private void seedComplaints() {
        List<Complaint> complaints = new ArrayList<>();

        // 1. Critical Complaint (Electricity)
        List<ComplaintActivity> c1Acts = new ArrayList<>();
        c1Acts.add(ComplaintActivity.builder().activityId("ACT-C-101").complaintId("CMP-2026-101").action("Complaint Submitted").performedBy("Karan Patel").timestamp(LocalDateTime.now().minusHours(10)).remarks("Sparks observed from A Wing 2nd floor electrical distribution board").build());
        complaints.add(Complaint.builder()
                .complaintId("CMP-2026-101").residentId("RES-1001").residentName("Karan Patel").flatNumber("A-101").building("A Wing")
                .category("ELECTRICITY").priority("CRITICAL").status("SUBMITTED")
                .title("Sparks from 2nd floor main electrical DB panel")
                .description("Continuous sparking observed from main corridor distribution panel near flat A-201. Urgent attention required before power trip.")
                .submissionTime(LocalDateTime.now().minusHours(10)).activityHistory(c1Acts).build());

        // 2. High Priority (Water Supply)
        List<ComplaintActivity> c2Acts = new ArrayList<>();
        c2Acts.add(ComplaintActivity.builder().activityId("ACT-C-102").complaintId("CMP-2026-102").action("Complaint Submitted").performedBy("Priya Desai").timestamp(LocalDateTime.now().minusHours(16)).remarks("Low water pressure in master bathroom line").build());
        c2Acts.add(ComplaintActivity.builder().activityId("ACT-C-103").complaintId("CMP-2026-102").action("Assigned to Staff").performedBy("Admin").timestamp(LocalDateTime.now().minusHours(12)).remarks("Assigned to Plumber Ramesh Verma").build());
        complaints.add(Complaint.builder()
                .complaintId("CMP-2026-102").residentId("RES-1003").residentName("Priya Desai").flatNumber("A-103").building("A Wing")
                .category("WATER_SUPPLY").priority("HIGH").status("ASSIGNED")
                .title("Low pressure in overhead water supply line")
                .description("Overhead water line feeding A-103 is experiencing severe pressure drop. Air lock suspected in terrace valve.")
                .assignedStaff("Ramesh Verma (Plumbing Tech)").staffContact("+91 98251 44556").assignedDate(LocalDateTime.now().minusHours(12))
                .submissionTime(LocalDateTime.now().minusHours(16)).activityHistory(c2Acts).build());

        // 3. Medium Priority (Lift) - In Progress
        List<ComplaintActivity> c3Acts = new ArrayList<>();
        c3Acts.add(ComplaintActivity.builder().activityId("ACT-C-104").complaintId("CMP-2026-103").action("Complaint Submitted").performedBy("Bhavin Choksi").timestamp(LocalDateTime.now().minusHours(24)).remarks("B Wing lift doors vibrating").build());
        c3Acts.add(ComplaintActivity.builder().activityId("ACT-C-105").complaintId("CMP-2026-103").action("Assigned to Staff").performedBy("Admin").timestamp(LocalDateTime.now().minusHours(18)).remarks("Assigned to Otis Tech Naresh").build());
        c3Acts.add(ComplaintActivity.builder().activityId("ACT-C-106").complaintId("CMP-2026-103").action("Status Changed to IN_PROGRESS").performedBy("Admin").timestamp(LocalDateTime.now().minusHours(8)).remarks("Technician replacing optical sensor alignment").build());
        complaints.add(Complaint.builder()
                .complaintId("CMP-2026-103").residentId("RES-2001").residentName("Bhavin Choksi").flatNumber("B-101").building("B Wing")
                .category("LIFT").priority("MEDIUM").status("IN_PROGRESS")
                .title("B Wing elevator door vibration on 1st floor")
                .description("Passenger lift in B Wing makes jittery noises while stopping on the 1st floor. Sensor alignment needed.")
                .assignedStaff("Naresh Rathod (Otis Tech)").staffContact("+91 98252 55667").assignedDate(LocalDateTime.now().minusHours(18))
                .submissionTime(LocalDateTime.now().minusHours(24)).activityHistory(c3Acts).build());

        // 4. Resolved Complaint (Plumbing)
        List<ComplaintActivity> c4Acts = new ArrayList<>();
        c4Acts.add(ComplaintActivity.builder().activityId("ACT-C-107").complaintId("CMP-2026-104").action("Complaint Submitted").performedBy("Rahul Shah").timestamp(LocalDateTime.now().minusDays(2)).remarks("Kitchen drain blockage").build());
        c4Acts.add(ComplaintActivity.builder().activityId("ACT-C-108").complaintId("CMP-2026-104").action("Assigned to Staff").performedBy("Admin").timestamp(LocalDateTime.now().minusDays(1).minusHours(18)).remarks("Assigned to Ramesh Verma").build());
        c4Acts.add(ComplaintActivity.builder().activityId("ACT-C-109").complaintId("CMP-2026-104").action("Complaint Resolved").performedBy("Admin").timestamp(LocalDateTime.now().minusDays(1)).remarks("Kitchen sink trap cleared and tested").build());
        complaints.add(Complaint.builder()
                .complaintId("CMP-2026-104").residentId("RES-1002").residentName("Rahul Shah").flatNumber("A-102").building("A Wing")
                .category("PLUMBING").priority("HIGH").status("RESOLVED")
                .title("Kitchen sink wastewater backflow")
                .description("Water backed up in kitchen sink drain after heavy usage upstairs.")
                .assignedStaff("Ramesh Verma (Plumbing Tech)").staffContact("+91 98251 44556").assignedDate(LocalDateTime.now().minusDays(1).minusHours(18))
                .resolutionDescription("Kitchen wastewater pipeline cleaned with pressurized snake drain machine. Damaged P-trap replaced.")
                .workPerformed("Replaced faulty 1.5-inch PVC P-trap pipe and tested with continuous running water.")
                .resolvedBy("Ramesh Verma (Plumber)").resolvedTime(LocalDateTime.now().minusDays(1))
                .submissionTime(LocalDateTime.now().minusDays(2)).activityHistory(c4Acts).build());

        // 5. Closed Complaint (Cleaning)
        List<ComplaintActivity> c5Acts = new ArrayList<>();
        c5Acts.add(ComplaintActivity.builder().activityId("ACT-C-110").complaintId("CMP-2026-105").action("Complaint Submitted").performedBy("Manish Randeria").timestamp(LocalDateTime.now().minusDays(4)).remarks("Staircase cleaning requested").build());
        c5Acts.add(ComplaintActivity.builder().activityId("ACT-C-111").complaintId("CMP-2026-105").action("Complaint Resolved").performedBy("CleanPro Supervisor").timestamp(LocalDateTime.now().minusDays(3)).remarks("Staircase washed and mopped").build());
        c5Acts.add(ComplaintActivity.builder().activityId("ACT-C-112").complaintId("CMP-2026-105").action("Complaint Closed").performedBy("Admin").timestamp(LocalDateTime.now().minusDays(2)).remarks("Closure Reason: Issue successfully resolved and verified with resident.").build());
        complaints.add(Complaint.builder()
                .complaintId("CMP-2026-105").residentId("RES-3001").residentName("Manish Randeria").flatNumber("C-101").building("C Wing")
                .category("CLEANING").priority("LOW").status("CLOSED")
                .title("Staircase dust cleaning in C Wing")
                .description("Dust accumulation after monsoon painting work on C Wing fire exit staircase.")
                .assignedStaff("CleanPro Team").assignedDate(LocalDateTime.now().minusDays(4))
                .resolutionDescription("Fire exit stairwell completely swept and wet-mopped with disinfectant.")
                .workPerformed("Wet cleaning performed across 4 floors of C Wing stairwell.")
                .resolvedBy("CleanPro Supervisor").resolvedTime(LocalDateTime.now().minusDays(3))
                .closureReason("Issue successfully resolved and verified with resident Manish Randeria.")
                .closedBy("Admin (Mr. Patel)").closureTime(LocalDateTime.now().minusDays(2))
                .submissionTime(LocalDateTime.now().minusDays(4)).activityHistory(c5Acts).build());

        // 6. Reopened Complaint (Security)
        List<ComplaintActivity> c6Acts = new ArrayList<>();
        c6Acts.add(ComplaintActivity.builder().activityId("ACT-C-113").complaintId("CMP-2026-106").action("Complaint Submitted").performedBy("Amit Mehta").timestamp(LocalDateTime.now().minusDays(5)).remarks("RFID Boom barrier sensor not scanning tag").build());
        c6Acts.add(ComplaintActivity.builder().activityId("ACT-C-114").complaintId("CMP-2026-106").action("Complaint Closed").performedBy("Admin").timestamp(LocalDateTime.now().minusDays(3)).remarks("Closure Reason: Sensor rebooted").build());
        c6Acts.add(ComplaintActivity.builder().activityId("ACT-C-115").complaintId("CMP-2026-106").action("Complaint Reopened").performedBy("Amit Mehta").timestamp(LocalDateTime.now().minusDays(1)).remarks("Reopened Reason: RFID tag failed again during evening entry; tag antenna needs replacement.").build());
        complaints.add(Complaint.builder()
                .complaintId("CMP-2026-106").residentId("RES-1004").residentName("Amit Mehta").flatNumber("A-104").building("A Wing")
                .category("SECURITY").priority("MEDIUM").status("REOPENED")
                .title("RFID Fastag vehicle entry reader failure at Main Gate")
                .description("Boom barrier antenna fails to detect car RFID sticker for vehicle GJ-05-CD-4421.")
                .assignedStaff("Surat Security Force Kiosk").assignedDate(LocalDateTime.now().minusDays(5))
                .reopenedReason("RFID tag failed again during evening entry; tag antenna needs replacement.")
                .reopenedBy("Amit Mehta (Resident)").reopenedTime(LocalDateTime.now().minusDays(1))
                .submissionTime(LocalDateTime.now().minusDays(5)).activityHistory(c6Acts).build());

        // 7 to 15. More realistic complaints
        complaints.add(Complaint.builder().complaintId("CMP-2026-107").residentId("RES-1005").residentName("Neha Joshi").flatNumber("A-201").building("A Wing").category("PARKING").priority("LOW").status("SUBMITTED").title("Unauthorized bike parked in bay A-201").description("Guest two-wheeler parked in resident allotted parking slot.").submissionTime(LocalDateTime.now().minusHours(5)).build());
        complaints.add(Complaint.builder().complaintId("CMP-2026-108").residentId("RES-2004").residentName("Deepika Bhatia").flatNumber("B-201").building("B Wing").category("WATER_SUPPLY").priority("HIGH").status("SUBMITTED").title("SMC municipal drinking water tank tap dry").description("Common RO drinking water dispenser in Clubhouse lobby not dispensing.").submissionTime(LocalDateTime.now().minusHours(3)).build());
        complaints.add(Complaint.builder().complaintId("CMP-2026-109").residentId("RES-3004").residentName("Bina Gheewala").flatNumber("C-201").building("C Wing").category("CLEANING").priority("MEDIUM").status("SUBMITTED").title("Garbage bin overflowing in basement parking").description("Dry and wet waste bins near C Wing parking lift require clearing.").submissionTime(LocalDateTime.now().minusHours(2)).build());
        complaints.add(Complaint.builder().complaintId("CMP-2026-110").residentId("RES-1007").residentName("Riya Vyas").flatNumber("A-203").building("A Wing").category("ELECTRICITY").priority("MEDIUM").status("ASSIGNED").title("Corridor LED light flickering outside A-203").description("Blinking LED tube light causing headache outside flat entrance.").assignedStaff("Mukesh Solanki (Electrician)").submissionTime(LocalDateTime.now().minusDays(1)).build());
        complaints.add(Complaint.builder().complaintId("CMP-2026-111").residentId("RES-2007").residentName("Nirav Jariwala").flatNumber("B-301").building("B Wing").category("LIFT").priority("HIGH").status("SUBMITTED").title("B Wing elevator fan stopped working").description("Circulation fan inside cabin stopped operating; stuffy during ride.").submissionTime(LocalDateTime.now().minusHours(7)).build());
        complaints.add(Complaint.builder().complaintId("CMP-2026-112").residentId("RES-3007").residentName("Gaurav Suratwala").flatNumber("C-301").building("C Wing").category("OTHER").priority("LOW").status("RESOLVED").title("Gymnasium treadmill emergency cord loose").description("Safety clip cord detached from treadmill #2 console.").resolutionDescription("Reattached safety key and calibrated sensor.").workPerformed("Treadmill clip spring refitted.").resolvedBy("Gym Trainer Vikram").resolvedTime(LocalDateTime.now().minusHours(12)).submissionTime(LocalDateTime.now().minusDays(2)).build());
        complaints.add(Complaint.builder().complaintId("CMP-2026-113").residentId("RES-1009").residentName("Anjali Shah").flatNumber("A-301").building("A Wing").category("PLUMBING").priority("CRITICAL").status("SUBMITTED").title("Terrace overhead tank overflow valve stuck").description("Water overflowing heavily from terrace tank onto A Wing balconies.").submissionTime(LocalDateTime.now().minusMinutes(45)).build());
        complaints.add(Complaint.builder().complaintId("CMP-2026-114").residentId("RES-2009").residentName("Pratik Gajiwala").flatNumber("B-401").building("B Wing").category("PARKING").priority("LOW").status("CLOSED").title("EV charging socket trip in basement").description("Common EV charger tripped MCB switch.").resolutionDescription("MCB reset and load distributed.").workPerformed("Replaced 16A socket with 25A industrial switch.").closureReason("Work completed and verified with resident.").closedBy("Admin").closureTime(LocalDateTime.now().minusDays(3)).submissionTime(LocalDateTime.now().minusDays(6)).build());
        complaints.add(Complaint.builder().complaintId("CMP-2026-115").residentId("RES-3009").residentName("Ashwin Contractor").flatNumber("C-401").building("C Wing").category("SECURITY").priority("MEDIUM").status("RESOLVED").title("Intercom buzzer line noise in flat C-401").description("Crackling audio sound when gate security calls.").resolutionDescription("Intercom connection wire terminal tightened.").workPerformed("EPABX line rewiring at junction box.").resolvedBy("Surat Telecom Tech").resolvedTime(LocalDateTime.now().minusDays(1)).submissionTime(LocalDateTime.now().minusDays(3)).build());

        complaintRepository.saveAll(complaints);
        log.info("Seeded {} complaints with complete workflow history for Green Valley Residency", complaints.size());
    }

    private void seedVisitors() {
        List<Visitor> visitors = List.of(
                Visitor.builder().visitorId("VIS-1001").name("Rajesh Kumar").phone("+91 98254 11221").visitingFlat("A-101").purpose("Amazon Delivery").entryTime(LocalDateTime.now().minusMinutes(25)).status("ACTIVE").vehicleNumber("GJ-05-EK-1299").securityGuard("Officer Vikram (Gate)").createdAt(LocalDateTime.now().minusMinutes(25)).build(),
                Visitor.builder().visitorId("VIS-1002").name("Suresh Patel").phone("+91 98254 22332").visitingFlat("B-102").purpose("Personal Guest").entryTime(LocalDateTime.now().minusHours(2)).status("ACTIVE").vehicleNumber("GJ-05-AB-7788").securityGuard("Officer Vikram (Gate)").createdAt(LocalDateTime.now().minusHours(2)).build(),
                Visitor.builder().visitorId("VIS-1003").name("Amit Sharma").phone("+91 98254 33443").visitingFlat("C-101").purpose("Maintenance Technician").entryTime(LocalDateTime.now().minusHours(4)).exitTime(LocalDateTime.now().minusHours(1)).status("CHECKED_OUT").vehicleNumber("GJ-05-TC-4411").securityGuard("Officer Jayesh").createdAt(LocalDateTime.now().minusHours(4)).build(),
                Visitor.builder().visitorId("VIS-1004").name("Dipesh Zaveri").phone("+91 98254 44554").visitingFlat("A-201").purpose("Family Guest").entryTime(LocalDateTime.now().minusMinutes(45)).status("ACTIVE").vehicleNumber("GJ-05-MM-3322").securityGuard("Officer Vikram (Gate)").createdAt(LocalDateTime.now().minusMinutes(45)).build(),
                Visitor.builder().visitorId("VIS-1005").name("Jitendra Parmar").phone("+91 98254 55665").visitingFlat("A-103").purpose("Zomato Delivery").entryTime(LocalDateTime.now().minusMinutes(15)).status("ACTIVE").vehicleNumber("GJ-05-QQ-9911").securityGuard("Officer Vikram (Gate)").createdAt(LocalDateTime.now().minusMinutes(15)).build(),
                Visitor.builder().visitorId("VIS-1006").name("Dr. Nilesh Gandhi").phone("+91 98254 66776").visitingFlat("B-201").purpose("Doctor Consultation").entryTime(LocalDateTime.now().minusHours(3)).exitTime(LocalDateTime.now().minusHours(2)).status("CHECKED_OUT").vehicleNumber("GJ-05-DG-0001").securityGuard("Officer Jayesh").createdAt(LocalDateTime.now().minusHours(3)).build(),
                Visitor.builder().visitorId("VIS-1007").name("Pravin Mistry").phone("+91 98254 77887").visitingFlat("B-301").purpose("Carpenter Work").entryTime(LocalDateTime.now().minusHours(5)).exitTime(LocalDateTime.now().minusHours(1)).status("CHECKED_OUT").vehicleNumber("GJ-05-KK-8833").securityGuard("Officer Jayesh").createdAt(LocalDateTime.now().minusHours(5)).build(),
                Visitor.builder().visitorId("VIS-1008").name("Mahesh Dhimmar").phone("+91 98254 88998").visitingFlat("C-201").purpose("Blinkit Grocery").entryTime(LocalDateTime.now().minusMinutes(10)).status("ACTIVE").vehicleNumber("GJ-05-BK-5522").securityGuard("Officer Vikram (Gate)").createdAt(LocalDateTime.now().minusMinutes(10)).build(),
                Visitor.builder().visitorId("VIS-1009").name("Jayesh Vaghani").phone("+91 98254 99009").visitingFlat("C-301").purpose("Chartered Accountant Meeting").entryTime(LocalDateTime.now().minusHours(6)).exitTime(LocalDateTime.now().minusHours(4)).status("CHECKED_OUT").vehicleNumber("GJ-05-JV-9988").securityGuard("Officer Jayesh").createdAt(LocalDateTime.now().minusHours(6)).build(),
                Visitor.builder().visitorId("VIS-1010").name("Sunil Kothari").phone("+91 98255 11001").visitingFlat("A-302").purpose("Guest").entryTime(LocalDateTime.now().minusHours(2)).status("ACTIVE").vehicleNumber("GJ-05-SK-7744").securityGuard("Officer Vikram (Gate)").createdAt(LocalDateTime.now().minusHours(2)).build(),
                Visitor.builder().visitorId("VIS-1011").name("Manoj Tailor").phone("+91 98255 22002").visitingFlat("B-103").purpose("AC Gas Refilling").entryTime(LocalDateTime.now().minusHours(7)).exitTime(LocalDateTime.now().minusHours(5)).status("CHECKED_OUT").vehicleNumber("GJ-05-MT-6611").securityGuard("Officer Jayesh").createdAt(LocalDateTime.now().minusHours(7)).build(),
                Visitor.builder().visitorId("VIS-1012").name("Ketan Bhatt").phone("+91 98255 33003").visitingFlat("C-402").purpose("Personal Guest").entryTime(LocalDateTime.now().minusHours(1)).status("ACTIVE").vehicleNumber("GJ-05-KB-1122").securityGuard("Officer Vikram (Gate)").createdAt(LocalDateTime.now().minusHours(1)).build()
        );

        visitorRepository.saveAll(visitors);
        log.info("Seeded {} Indian visitor records for Green Valley Residency", visitors.size());
    }

    private void seedNotices() {
        List<Notice> notices = List.of(
                Notice.builder().noticeId("NOT-2026-01").title("Annual General Body Meeting (AGM) 2026").description("The Annual General Body Meeting of Green Valley Residency Co-operative Housing Society will be held on Sunday, March 29 at 10:30 AM in the Central Clubhouse. Key agenda: annual audited balance sheet, lift AMC review, and solar rooftop installation subsidy proposal. All members are requested to attend.").category("GENERAL").publicationDate(LocalDate.now().minusDays(2)).pinned(true).author("Managing Committee, Surat").createdAt(LocalDateTime.now().minusDays(2)).updatedAt(LocalDateTime.now().minusDays(2)).build(),
                Notice.builder().noticeId("NOT-2026-02").title("Surat Municipal Corporation Water Line Maintenance").description("As per SMC notification for Vesu ward, municipal water supply will remain suspended on Thursday from 9:00 AM to 4:00 PM for pipeline tie-in near VIP Road junction. Borewell water will be supplied for domestic use. Please store adequate drinking water.").category("MAINTENANCE").publicationDate(LocalDate.now().minusDays(4)).pinned(true).author("Facility Manager").createdAt(LocalDateTime.now().minusDays(4)).updatedAt(LocalDateTime.now().minusDays(4)).build(),
                Notice.builder().noticeId("NOT-2026-03").title("Fire Safety Audit & Mock Drill by Surat Fire Dept").description("Mandatory annual fire safety inspection, riser pressure checking, and live evacuation drill will be conducted with officials from Vesu Fire Station this Saturday at 11:00 AM. Residents are invited to participate in fire extinguisher training.").category("SECURITY").publicationDate(LocalDate.now().minusDays(7)).pinned(true).author("Security Directorate").createdAt(LocalDateTime.now().minusDays(7)).updatedAt(LocalDateTime.now().minusDays(7)).build(),
                Notice.builder().noticeId("NOT-2026-04").title("Holi & Dhuleti Celebration in Play Garden").description("Society Holi celebration with organic colors and eco-friendly flower petals will take place in the Children Play Garden on March 25th from 9:30 AM to 1:00 PM. Thandai and festive sweets will be arranged by the committee. Water balloons strictly prohibited.").category("EVENT").publicationDate(LocalDate.now().minusDays(10)).pinned(false).author("Cultural Committee").createdAt(LocalDateTime.now().minusDays(10)).updatedAt(LocalDateTime.now().minusDays(10)).build(),
                Notice.builder().noticeId("NOT-2026-05").title("Terrace Waterproofing Work Prior to Monsoons").description("Civil waterproofing and tile grouting on terrace roofs of A, B, and C Wings will commence from next Monday. Access to terraces will remain restricted between 8:00 AM and 6:00 PM for safety during chemical coating application.").category("MAINTENANCE").publicationDate(LocalDate.now().minusDays(12)).pinned(false).author("Civil Works Sub-Committee").createdAt(LocalDateTime.now().minusDays(12)).updatedAt(LocalDateTime.now().minusDays(12)).build(),
                Notice.builder().noticeId("NOT-2026-06").title("Electric Vehicle (EV) Charging Guidelines in Basement").description("Residents installing 15A/16A home EV charging points at their allotted parking bays must submit electrician load certificates to the society office. Tapping common electricity lines without prior sub-meter installation will attract fines.").category("SECURITY").publicationDate(LocalDate.now().minusDays(15)).pinned(false).author("Managing Committee").createdAt(LocalDateTime.now().minusDays(15)).updatedAt(LocalDateTime.now().minusDays(15)).build(),
                Notice.builder().noticeId("NOT-2026-07").title("Late Payment Penalty Policy Reminder - ₹250").description("Maintenance bills for the month of March 2026 are due on or before 15th March. Late fee of ₹250 per month will be applicable on all outstanding accounts after the grace period as per society bye-laws.").category("MAINTENANCE").publicationDate(LocalDate.now().minusDays(18)).pinned(false).author("Treasurer").createdAt(LocalDateTime.now().minusDays(18)).updatedAt(LocalDateTime.now().minusDays(18)).build(),
                Notice.builder().noticeId("NOT-2026-08").title("Plastic Waste Segregation & Green Vesu Drive").description("In accordance with Surat Municipal Corporation Swachhata guidelines, segregation of dry and wet household waste is strictly mandatory. Color-coded bins are installed on each floor lobby. Please do not dispose of wet garbage in dry bins.").category("GENERAL").publicationDate(LocalDate.now().minusDays(22)).pinned(false).author("Managing Committee").createdAt(LocalDateTime.now().minusDays(22)).updatedAt(LocalDateTime.now().minusDays(22)).build()
        );

        noticeRepository.saveAll(notices);
        log.info("Seeded {} Indian society notices for Green Valley Residency", notices.size());
    }

    public synchronized void synchronizeDataStructures() {
        // 1. Synchronize ArrayList with Payments & Expenses
        List<MaintenanceRecord> allPayments = maintenanceRepository.findAll();
        paymentRecordManager.setPaymentRecords(allPayments);

        List<Expense> allExpenses = expenseRepository.findAll();
        paymentRecordManager.setExpenseRecords(allExpenses);

        // 2. Synchronize LinkedList with Resident Activities
        List<ResidentActivity> allActivities = residentActivityRepository.findAllByOrderByTimestampDesc();
        if (allActivities.isEmpty()) {
            List<Resident> residents = residentRepository.findAll();
            for (Resident r : residents) {
                ResidentActivity act = ResidentActivity.builder()
                        .activityId("ACT-INIT-" + r.getFlatNumber())
                        .residentId(r.getResidentId())
                        .residentName(r.getName())
                        .flatNumber(r.getFlatNumber())
                        .actionType("REGISTRATION")
                        .description("Resident " + r.getName() + " onboarded to Flat " + r.getFlatNumber() + " (" + r.getBuilding() + ")")
                        .performedBy("System")
                        .timestamp(LocalDateTime.now().minusDays(15))
                        .build();
                allActivities.add(act);
            }
            residentActivityRepository.saveAll(allActivities);
        }
        residentActivityManager.setActivities(allActivities);

        // 3. Synchronize Stack with Admin Operations
        List<AdminOperation> operations = adminOperationRepository.findAllByOrderByTimestampDesc();
        undoManager.initializeFromDb(operations);

        // 4. Synchronize FIFO Queue with Normal Submitted/Reopened Complaints
        List<Complaint> allComplaints = complaintRepository.findAll();
        complaintQueueManager.initializeQueue(allComplaints);

        // 5. Synchronize PriorityQueue with Complaints
        complaintPriorityManager.initializePriorityQueue(allComplaints);

        // 6. Synchronize BST with Maintenance Records
        maintenanceBST.rebuild(allPayments);

        // 7. Graph Topology (Seed if empty)
        if (buildingGraph.getAllVertices().isEmpty()) {
            seedBuildingTopology();
        }

        // 8. Synchronize AVL Tree with Residents
        List<Resident> activeResidents = residentRepository.findByActive(true);
        residentAVLTree.rebuild(activeResidents);

        log.info("Synchronized 8 backend Data Structures for Green Valley Residency: " +
                "ArrayList (Payments: {}, Expenses: {}), " +
                "LinkedList (Activities: {}), " +
                "Stack (Undo items: {}), " +
                "FIFO Queue (Complaints: {}), " +
                "PriorityQueue (Ranked: {}), " +
                "BST (Months: {}), " +
                "Graph (Vertices: {}), " +
                "AVL Tree (Residents: {}, Rotations: {})",
                paymentRecordManager.getAllPayments().size(), paymentRecordManager.getAllExpenses().size(),
                residentActivityManager.getAllActivities().size(),
                undoManager.size(),
                complaintQueueManager.size(),
                complaintPriorityManager.size(),
                maintenanceBST.inOrderTraversal().size(),
                buildingGraph.getAllVertices().size(),
                residentAVLTree.getSize(), residentAVLTree.getTotalRotations());
    }
}
