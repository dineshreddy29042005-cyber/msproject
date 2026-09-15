package com.codethon.microsoft.repository;

import com.codethon.microsoft.entity.PlagiarismMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlagiarismMatchRepository extends JpaRepository<PlagiarismMatch, Long> {
    List<PlagiarismMatch> findByAnalysisResultId(Long analysisResultId);
    List<PlagiarismMatch> findByAnalysisResultIdOrderBySimilarityScoreDesc(Long analysisResultId);
}
