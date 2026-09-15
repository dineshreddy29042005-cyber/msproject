package com.codethon.microsoft.repository;

import com.codethon.microsoft.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserId(Long userId);
    List<Document> findByUserIdOrderByUploadedAtDesc(Long userId);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.user.id = :userId")
    long countByUserId(Long userId);

    @Query("SELECT d FROM Document d WHERE d.user.id = :userId AND d.status = :status")
    List<Document> findByUserIdAndStatus(Long userId, Document.DocumentStatus status);
}
