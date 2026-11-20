package com.buildwise.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notices")
public class Notice {
    @Id
    private String id;
    private String noticeId;        // e.g. NOT-1001
    private String title;
    private String description;
    private String category;        // GENERAL, MAINTENANCE, EVENT, SECURITY, EMERGENCY
    private LocalDate publicationDate;
    private boolean pinned;
    private String author;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
