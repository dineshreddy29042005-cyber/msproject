package com.codethon.microsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlagiarismMatchDto {
    private Long id;
    private String sourceTitle;
    private String sourceUrl;
    private String matchedText;
    private String sourceText;
    private Double similarityScore;
    private String matchType;
    private Integer startPosition;
    private Integer endPosition;
    private String sectionName;
}
