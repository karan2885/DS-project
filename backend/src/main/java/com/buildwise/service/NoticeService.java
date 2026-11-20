package com.buildwise.service;

import com.buildwise.datastructures.UndoManager;
import com.buildwise.model.AdminOperation;
import com.buildwise.model.Notice;
import com.buildwise.repository.AdminOperationRepository;
import com.buildwise.repository.NoticeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final AdminOperationRepository adminOperationRepository;
    private final UndoManager undoManager;
    private final ObjectMapper objectMapper;

    public List<Notice> getAllNotices() {
        return noticeRepository.findAllByOrderByPublicationDateDesc();
    }

    public List<Notice> getPinnedNotices() {
        return noticeRepository.findByPinned(true);
    }

    public Optional<Notice> getById(String id) {
        return noticeRepository.findById(id);
    }

    public Notice createNotice(Notice notice) {
        if (notice.getNoticeId() == null || notice.getNoticeId().isEmpty()) {
            notice.setNoticeId("NOT-" + (1000 + (int)(Math.random() * 9000)));
        }
        if (notice.getPublicationDate() == null) {
            notice.setPublicationDate(LocalDate.now());
        }
        notice.setCreatedAt(LocalDateTime.now());
        notice.setUpdatedAt(LocalDateTime.now());
        return noticeRepository.save(notice);
    }

    public Notice updateNotice(String id, Notice details) {
        Notice existing = noticeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notice not found: " + id));

        existing.setTitle(details.getTitle());
        existing.setDescription(details.getDescription());
        existing.setCategory(details.getCategory());
        existing.setPinned(details.isPinned());
        existing.setAuthor(details.getAuthor());
        existing.setUpdatedAt(LocalDateTime.now());
        return noticeRepository.save(existing);
    }

    public void deleteNotice(String id) {
        Notice existing = noticeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notice not found: " + id));

        String oldJson = toJson(existing);
        noticeRepository.deleteById(id);

        // Push to Undo Stack
        recordUndoOperation("NOTICE_DELETE", "Notice", existing.getId(),
                "Deleted notice: '" + existing.getTitle() + "'",
                oldJson, null);
    }

    public void restoreNotice(Notice notice) {
        notice.setUpdatedAt(LocalDateTime.now());
        noticeRepository.save(notice);
        log.info("Restored notice: {}", notice.getTitle());
    }

    private void recordUndoOperation(String opType, String entityType, String entityId, String desc, String prevJson, String updatedJson) {
        AdminOperation op = AdminOperation.builder()
                .operationId("OP-" + UUID.randomUUID().toString().substring(0, 8))
                .operationType(opType)
                .entityType(entityType)
                .entityId(entityId)
                .description(desc)
                .previousStateJson(prevJson)
                .updatedStateJson(updatedJson)
                .timestamp(LocalDateTime.now())
                .undone(false)
                .build();
        adminOperationRepository.save(op);
        undoManager.pushOperation(op);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "";
        }
    }
}
