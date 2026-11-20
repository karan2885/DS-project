package com.buildwise.controller;

import com.buildwise.model.Notice;
import com.buildwise.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public ResponseEntity<List<Notice>> getNotices() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    @GetMapping("/pinned")
    public ResponseEntity<List<Notice>> getPinnedNotices() {
        return ResponseEntity.ok(noticeService.getPinnedNotices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notice> getById(@PathVariable String id) {
        return noticeService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Notice> createNotice(@RequestBody Notice notice) {
        return ResponseEntity.ok(noticeService.createNotice(notice));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Notice> updateNotice(@PathVariable String id, @RequestBody Notice notice) {
        return ResponseEntity.ok(noticeService.updateNotice(id, notice));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable String id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.noContent().build();
    }
}
