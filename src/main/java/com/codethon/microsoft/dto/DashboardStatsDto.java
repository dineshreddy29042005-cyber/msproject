package com.codethon.microsoft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalDocuments;
    private long analyzedDocuments;
    private long pendingDocuments;
    private Double averagePlagiarismScore;
    private long highRiskCount;
    private long mediumRiskCount;
    private long lowRiskCount;
    private long criticalRiskCount;
}
