package com.codethon.microsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDto {
    private Long id;
    private String title;
    private String originalFilename;
    private Long fileSize;
    private String fileType;
    private String status;
    private LocalDateTime uploadedAt;
    private String username;
    private AnalysisResultDto latestAnalysis;
}
