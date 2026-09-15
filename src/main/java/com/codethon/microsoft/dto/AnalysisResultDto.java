package com.codethon.microsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResultDto {
    private Long id;
    private Long documentId;
    private String documentTitle;
    private Double overallScore;
    private Double semanticScore;
    private Double paraphraseScore;
    private Double exactMatchScore;
    private String riskLevel;
    private String summary;
    private String explanation;
    private String status;
    private LocalDateTime analyzedAt;
    private LocalDateTime completedAt;
    private List<PlagiarismMatchDto> matches;
}
