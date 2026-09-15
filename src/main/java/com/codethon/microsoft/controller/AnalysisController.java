package com.codethon.microsoft.controller;

import com.codethon.microsoft.dto.AnalysisResultDto;
import com.codethon.microsoft.dto.DashboardStatsDto;
import com.codethon.microsoft.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @GetMapping("/document/{documentId}")
    public ResponseEntity<AnalysisResultDto> getResultByDocument(@PathVariable Long documentId) {
        return ResponseEntity.ok(analysisService.getResultByDocumentId(documentId));
    }

    @GetMapping("/{resultId}")
    public ResponseEntity<AnalysisResultDto> getResultById(@PathVariable Long resultId) {
        return ResponseEntity.ok(analysisService.getResultById(resultId));
    }

    @GetMapping("/my-results")
    public ResponseEntity<List<AnalysisResultDto>> getMyResults() {
        return ResponseEntity.ok(analysisService.getMyResults());
    }
    @GetMapping("/dashboard-stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(analysisService.getDashboardStats());
    }
}
