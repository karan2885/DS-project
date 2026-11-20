package com.buildwise.repository;

import com.buildwise.model.Notice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoticeRepository extends MongoRepository<Notice, String> {
    Optional<Notice> findByNoticeId(String noticeId);
    List<Notice> findByPinned(boolean pinned);
    List<Notice> findByCategory(String category);
    List<Notice> findAllByOrderByPublicationDateDesc();
}
