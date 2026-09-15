package com.codethon.microsoft.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "analysis_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "overall_score")
    private Double overallScore;

    @Column(name = "semantic_score")
    private Double semanticScore;

    @Column(name = "paraphrase_score")
    private Double paraphraseScore;

    @Column(name = "exact_match_score")
    private Double exactMatchScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level")
    private RiskLevel riskLevel;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnalysisStatus status;

    @OneToMany(mappedBy = "analysisResult", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PlagiarismMatch> matches;

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        analyzedAt = LocalDateTime.now();
        if (status == null) status = AnalysisStatus.PENDING;
    }

    public enum RiskLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum AnalysisStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }
}
