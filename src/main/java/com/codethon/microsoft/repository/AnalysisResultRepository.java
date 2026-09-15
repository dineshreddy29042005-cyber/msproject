package com.codethon.microsoft.repository;

import com.codethon.microsoft.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {
    Optional<AnalysisResult> findByDocumentId(Long documentId);
    List<AnalysisResult> findByDocumentUserIdOrderByAnalyzedAtDesc(Long userId);

    @Query("SELECT AVG(a.overallScore) FROM AnalysisResult a WHERE a.document.user.id = :userId AND a.status = 'COMPLETED'")
    Double avgScoreByUserId(Long userId);

    @Query("SELECT COUNT(a) FROM AnalysisResult a WHERE a.document.user.id = :userId AND a.riskLevel = :riskLevel")
    long countByUserIdAndRiskLevel(Long userId, AnalysisResult.RiskLevel riskLevel);
}
