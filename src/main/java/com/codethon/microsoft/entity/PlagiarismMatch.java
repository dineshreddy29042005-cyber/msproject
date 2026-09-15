package com.codethon.microsoft.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "plagiarism_matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlagiarismMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_result_id", nullable = false)
    private AnalysisResult analysisResult;

    @Column(name = "source_title")
    private String sourceTitle;

    @Column(name = "source_url")
    private String sourceUrl;

    @Column(name = "matched_text", columnDefinition = "TEXT")
    private String matchedText;

    @Column(name = "source_text", columnDefinition = "TEXT")
    private String sourceText;

    @Column(name = "similarity_score")
    private Double similarityScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_type")
    private MatchType matchType;

    @Column(name = "start_position")
    private Integer startPosition;

    @Column(name = "end_position")
    private Integer endPosition;

    @Column(name = "section_name")
    private String sectionName;

    public enum MatchType {
        EXACT, SEMANTIC, PARAPHRASE
    }
}
